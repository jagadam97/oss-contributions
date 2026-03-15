/**
 * sync-pr-status.ts
 *
 * Reads every contribution that has a pr_url from Supabase, calls the
 * GitHub REST API to fetch the current state of that PR, then writes
 * back any changed fields (status, merged_at, stars).
 *
 * Run locally:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx GITHUB_TOKEN=xxx npm run sync
 *
 * Runs automatically via .github/workflows/sync-pr-status.yml on a cron.
 */

import { createClient } from "@supabase/supabase-js";
import type { Contribution, ContributionStatus } from "../lib/types";

// ─── Config ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌  Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

// Service-role client bypasses RLS so we can write rows
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── GitHub API helpers ──────────────────────────────────────────────────────

interface GitHubPR {
  title: string;
  state: "open" | "closed";
  merged_at: string | null;
  base: {
    repo: {
      stargazers_count: number;
      language: string | null;
    };
  };
}

/**
 * Parses a GitHub PR URL and returns { owner, repo, number }.
 * Supports:
 *   https://github.com/owner/repo/pull/123
 *   https://github.com/owner/repo/pull/123#issuecomment-…
 */
function parsePrUrl(url: string): { owner: string; repo: string; number: number } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2], number: parseInt(match[3], 10) };
}

async function fetchGitHubPR(
  owner: string,
  repo: string,
  number: number
): Promise<GitHubPR | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "oss-contributions-sync/1.0",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
    { headers }
  );

  if (res.status === 404) {
    console.warn(`  ⚠️  PR not found: ${owner}/${repo}#${number}`);
    return null;
  }
  if (!res.ok) {
    console.error(
      `  ❌  GitHub API error ${res.status} for ${owner}/${repo}#${number}: ${await res.text()}`
    );
    return null;
  }

  return res.json() as Promise<GitHubPR>;
}

/** Maps a GitHub PR response to our ContributionStatus enum. */
function toStatus(pr: GitHubPR): ContributionStatus {
  if (pr.state === "open") return "open";
  return pr.merged_at ? "merged" : "closed";
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔄  Starting PR status sync…\n");

  // 1. Fetch all contributions that have a PR URL
  const { data: rows, error: fetchError } = await supabase
    .from("contributions")
    .select("id, project, pr_url, status, merged_at, stars, title")
    .not("pr_url", "is", null);

  if (fetchError) {
    console.error("❌  Failed to fetch contributions from Supabase:", fetchError.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("ℹ️   No contributions with a pr_url found. Nothing to sync.");
    return;
  }

  const contributions = rows as Pick<
    Contribution,
    "id" | "project" | "pr_url" | "status" | "merged_at" | "stars" | "title"
  >[];

  console.log(`📋  Found ${contributions.length} contributions with a PR URL.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const contribution of contributions) {
    const { id, project, pr_url, status: currentStatus } = contribution;
    console.log(`→  [${project}] ${pr_url}`);

    const parsed = parsePrUrl(pr_url!);
    if (!parsed) {
      console.warn(`   ⚠️  Could not parse PR URL, skipping.`);
      skipped++;
      continue;
    }

    const pr = await fetchGitHubPR(parsed.owner, parsed.repo, parsed.number);
    if (!pr) {
      failed++;
      continue;
    }

    const newStatus = toStatus(pr);
    const newMergedAt = pr.merged_at ? pr.merged_at.split("T")[0] : null;
    const newStars = pr.base.repo.stargazers_count;
    const newTitle = pr.title;

    // Build update payload — only include fields that actually changed
    const patch: Partial<Contribution> = {};

    if (newTitle && newTitle !== contribution.title) {
      patch.title = newTitle;
      console.log(`   title: "${contribution.title ?? ""}" → "${newTitle}"`);
    }
    if (newStatus !== currentStatus) {
      patch.status = newStatus;
      console.log(`   status: ${currentStatus} → ${newStatus}`);
    }
    if (newMergedAt && newMergedAt !== contribution.merged_at) {
      patch.merged_at = newMergedAt;
      console.log(`   merged_at: ${contribution.merged_at ?? "null"} → ${newMergedAt}`);
    }
    if (newStars !== contribution.stars) {
      patch.stars = newStars;
      console.log(`   stars: ${contribution.stars ?? "?"} → ${newStars}`);
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

    // Small delay to stay well within GitHub API rate limits (5000 req/hr authenticated)
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Sync complete
  ✅  Updated : ${updated}
  ⏭️   Skipped : ${skipped}
  ❌  Failed  : ${failed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
