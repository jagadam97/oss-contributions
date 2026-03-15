/**
 * sync-pr-status.ts
 *
 * Syncs open/reviewed PRs from GitHub → Supabase.
 *
 * Optimisations for 100+ PRs:
 *  - Skips already-merged and closed PRs entirely (no wasted API calls)
 *  - Fetches repo stars once per unique repo, not once per PR
 *  - Respects X-RateLimit-Remaining; pauses automatically when low
 *  - Retries on 429 / 403 (secondary rate limit) with exponential back-off
 *  - Authenticated requests give 5 000 req/hr (GITHUB_TOKEN auto-injected in Actions)
 *
 * Run locally:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx GITHUB_TOKEN=xxx npm run sync
 */

import { createClient } from "@supabase/supabase-js";
import type { Contribution, ContributionStatus } from "../lib/types";

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_TOKEN      = process.env.GITHUB_TOKEN;

// Pause all requests when remaining budget falls to this level
const RATE_LIMIT_PAUSE_AT = 50;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── GitHub API ───────────────────────────────────────────────────────────────

interface GitHubPR {
  title: string;
  state: "open" | "closed";
  merged_at: string | null;
}

interface GitHubRepo {
  stargazers_count: number;
  language: string | null;
}

function githubHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "oss-contributions-sync/1.0",
  };
  if (GITHUB_TOKEN) h["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  return h;
}

/** Sleep for ms milliseconds */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch a URL from the GitHub API.
 * - Automatically waits if the rate-limit budget is low.
 * - Retries up to `maxRetries` times on 429/403/5xx with exponential back-off.
 */
async function githubFetch(url: string, maxRetries = 4): Promise<Response> {
  let attempt = 0;

  while (true) {
    const res = await fetch(url, { headers: githubHeaders() });

    // Track remaining budget
    const remaining = parseInt(res.headers.get("X-RateLimit-Remaining") ?? "999", 10);
    const resetAt   = parseInt(res.headers.get("X-RateLimit-Reset")     ?? "0",   10);

    if (remaining <= RATE_LIMIT_PAUSE_AT && resetAt > 0) {
      const waitMs = Math.max(0, (resetAt * 1000) - Date.now()) + 2000;
      console.log(`   ⏳  Rate limit low (${remaining} left). Pausing ${Math.ceil(waitMs / 1000)}s…`);
      await sleep(waitMs);
    }

    // Success
    if (res.ok) return res;

    // Rate limited or secondary rate limit
    if (res.status === 429 || res.status === 403) {
      const retryAfter = res.headers.get("Retry-After");
      const waitMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : Math.min(1000 * 2 ** attempt, 60_000); // exponential back-off, max 60s

      attempt++;
      if (attempt > maxRetries) {
        console.error(`   ❌  Rate limited after ${maxRetries} retries: ${url}`);
        return res; // caller handles non-ok
      }
      console.log(`   ⏳  Rate limited (${res.status}). Retry ${attempt}/${maxRetries} in ${Math.ceil(waitMs / 1000)}s…`);
      await sleep(waitMs);
      continue;
    }

    // Other errors — don't retry
    return res;
  }
}

function parsePrUrl(url: string): { owner: string; repo: string; number: number } | null {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2], number: parseInt(m[3], 10) };
}

function toStatus(pr: GitHubPR): ContributionStatus {
  if (pr.state === "open") return "open";
  return pr.merged_at ? "merged" : "closed";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔄  Starting PR status sync…\n");

  // 1. Fetch only open/reviewed PRs — merged and closed are final, skip them
  const { data: rows, error: fetchError } = await supabase
    .from("contributions")
    .select("id, project, pr_url, status, merged_at, stars, title")
    .not("pr_url", "is", null)
    .in("status", ["open", "reviewed"]);  // ← only non-terminal statuses

  if (fetchError) {
    console.error("❌  Failed to fetch from Supabase:", fetchError.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("ℹ️   No open/reviewed PRs to sync. All done.");
    return;
  }

  type Row = Pick<Contribution, "id" | "project" | "pr_url" | "status" | "merged_at" | "stars" | "title">;
  const contributions = rows as Row[];

  console.log(`📋  ${contributions.length} open/reviewed PR(s) to check.\n`);

  // 2. Pre-fetch stars for each unique repo in one pass (saves N-1 API calls
  //    when multiple PRs share a repo)
  const uniqueRepos = new Set(
    contributions
      .map((c) => parsePrUrl(c.pr_url!))
      .filter(Boolean)
      .map((p) => `${p!.owner}/${p!.repo}`)
  );

  const repoStars = new Map<string, number>();

  console.log(`🌟  Fetching stars for ${uniqueRepos.size} unique repo(s)…`);
  for (const fullName of uniqueRepos) {
    const res = await githubFetch(`https://api.github.com/repos/${fullName}`);
    if (res.ok) {
      const data: GitHubRepo = await res.json();
      repoStars.set(fullName, data.stargazers_count);
      console.log(`   ${fullName} → ${data.stargazers_count.toLocaleString()} stars`);
    } else {
      console.warn(`   ⚠️  Could not fetch repo ${fullName} (${res.status})`);
    }
  }
  console.log();

  // 3. Check each open/reviewed PR
  let updated = 0;
  let skipped = 0;
  let failed  = 0;

  for (const contribution of contributions) {
    const { id, project, pr_url, status: currentStatus } = contribution;
    console.log(`→  [${project}] ${pr_url}`);

    const parsed = parsePrUrl(pr_url!);
    if (!parsed) {
      console.warn(`   ⚠️  Could not parse PR URL, skipping.`);
      skipped++;
      continue;
    }

    const res = await githubFetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/pulls/${parsed.number}`
    );

    if (res.status === 404) {
      console.warn(`   ⚠️  PR not found.`);
      skipped++;
      continue;
    }
    if (!res.ok) {
      console.error(`   ❌  GitHub API error ${res.status}`);
      failed++;
      continue;
    }

    const pr: GitHubPR = await res.json();
    const newStatus   = toStatus(pr);
    const newMergedAt = pr.merged_at ? pr.merged_at.split("T")[0] : null;
    const newTitle    = pr.title;
    const newStars    = repoStars.get(`${parsed.owner}/${parsed.repo}`);

    // Build patch — only changed fields
    const patch: Partial<Contribution> = {};

    if (newTitle && newTitle !== contribution.title) {
      patch.title = newTitle;
      console.log(`   title:     "${contribution.title ?? ""}" → "${newTitle}"`);
    }
    if (newStatus !== currentStatus) {
      patch.status = newStatus;
      console.log(`   status:    ${currentStatus} → ${newStatus}`);
    }
    if (newMergedAt && newMergedAt !== contribution.merged_at) {
      patch.merged_at = newMergedAt;
      console.log(`   merged_at: ${contribution.merged_at ?? "null"} → ${newMergedAt}`);
    }
    if (newStars !== undefined && newStars !== contribution.stars) {
      patch.stars = newStars;
      console.log(`   stars:     ${contribution.stars ?? "?"} → ${newStars}`);
    }

    if (Object.keys(patch).length === 0) {
      console.log(`   ✓  No changes.`);
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("contributions")
      .update(patch)
      .eq("id", id);

    if (updateError) {
      console.error(`   ❌  Supabase update failed: ${updateError.message}`);
      failed++;
    } else {
      console.log(`   ✅  Updated.`);
      updated++;
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Sync complete
  ✅  Updated  : ${updated}
  ⏭️   Skipped  : ${skipped}  (no changes or unparseable)
  ❌  Failed   : ${failed}
  🔒  Skipped merged/closed PRs at query level
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
