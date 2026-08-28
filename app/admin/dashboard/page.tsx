"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase-browser";
import type { Contribution, ContributionStatus, ContributionType } from "@/lib/types";
import {
  LogOut, Plus, Trash2, Pencil, X, Check,
  Loader2, ExternalLink, Github,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type FormState = {
  pr_url: string;
  title: string;
  project: string;
  repo_url: string;
  description: string;
  status: ContributionStatus;
  type: ContributionType;
  language: string;
  stars: string;
  merged_at: string;
  tags: string; // comma-separated in the form
  issue_url: string;
};

const EMPTY_FORM: FormState = {
  pr_url: "",
  title: "",
  project: "",
  repo_url: "",
  description: "",
  status: "open",
  type: "feature",
  language: "",
  stars: "",
  merged_at: "",
  tags: "",
  issue_url: "",
};

// ─── GitHub API helpers ──────────────────────────────────────────────────────

function parsePrUrl(url: string) {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2], number: m[3] };
}

async function fetchPrData(prUrl: string, githubToken?: string): Promise<Partial<FormState> | null> {
  const parsed = parsePrUrl(prUrl);
  if (!parsed) return null;

  const { owner, repo, number } = parsed;

  // Use the GitHub OAuth token from the user's Supabase session when available.
  // This gives 5 000 req/hr instead of the unauthenticated 60 req/hr limit.
  const ghHeaders: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (githubToken) ghHeaders["Authorization"] = `Bearer ${githubToken}`;

  // Fetch PR + repo in parallel
  const [prRes, repoRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`, { headers: ghHeaders }),
    fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders }),
  ]);

  if (!prRes.ok) return null;

  const pr = await prRes.json();
  const repoData = repoRes.ok ? await repoRes.json() : null;

  // Map state → our status enum
  let status: ContributionStatus = "open";
  if (pr.state === "closed") status = pr.merged_at ? "merged" : "closed";

  // Guess type from PR labels
  const labels: string[] = (pr.labels ?? []).map((l: { name: string }) =>
    l.name.toLowerCase()
  );
  let type: ContributionType = "feature";
  if (labels.some((l) => l.includes("bug") || l.includes("fix"))) type = "bug-fix";
  else if (labels.some((l) => l.includes("doc"))) type = "docs";
  else if (labels.some((l) => l.includes("refactor"))) type = "refactor";
  else if (labels.some((l) => l.includes("test"))) type = "test";
  else if (labels.some((l) => l.includes("chore") || l.includes("ci"))) type = "chore";

  // Tags from labels (cleaned up)
  const tags = labels
    .filter((l) => l.length < 30)
    .slice(0, 6)
    .join(", ");

  return {
    title: pr.title ?? "",
    project: repoData?.name ?? repo,
    repo_url: `https://github.com/${owner}/${repo}`,
    description: pr.body
      ? pr.body.replace(/<!--[\s\S]*?-->/g, "").trim().slice(0, 300)
      : "",
    status,
    type,
    language: repoData?.language ?? "",
    stars: repoData?.stargazers_count?.toString() ?? "",
    merged_at: pr.merged_at ? pr.merged_at.split("T")[0] : "",
    tags,
  };
}

// ─── Terminal styling ────────────────────────────────────────────────────────
// Same palette as the public portfolio: square borders, phosphor green on black.

const statusColor: Record<ContributionStatus, string> = {
  merged:   "text-[#a855f7]",
  open:     "text-[#00ff41]",
  closed:   "text-[#ff3333]",
  reviewed: "text-[#3b82f6]",
};

const typeColor: Record<string, string> = {
  "bug-fix": "text-[#ff3333]",
  feature:   "text-[#00ff41]",
  docs:      "text-[#ffb800]",
  refactor:  "text-[#38bdf8]",
  test:      "text-[#2dd4bf]",
  chore:     "text-[#4a7a4a]",
};

const inputClass =
  "w-full bg-[#0a0a0a] border border-[#333] px-3 py-2 text-xs text-[#b0ffb0] placeholder:text-[#2d5a2d] focus:border-[#00ff41] focus:outline-none terminal-glow transition-colors";

const selectClass =
  "w-full bg-[#0a0a0a] border border-[#333] px-3 py-2 text-xs text-[#00ff41] focus:border-[#00ff41] focus:outline-none terminal-glow transition-colors cursor-pointer";

const btnPrimary =
  "flex items-center gap-2 border border-[#00ff41] bg-[#0d1a0d] px-4 py-2 text-xs text-[#00ff41] hover:bg-[#00ff41] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const btnGhost =
  "flex items-center gap-2 border border-[#333] px-4 py-2 text-xs text-[#4a7a4a] hover:border-[#00ff41] hover:text-[#00ff41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Terminal window frame with a title bar, matching the portfolio hero. */
function TerminalWindow({
  title, children, right,
}: {
  title: string; children: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <div className="border border-[#333] bg-[#0a0a0a]">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#111] border-b border-[#333]">
        <span className="terminal-dot bg-[#ff5f57]" />
        <span className="terminal-dot bg-[#ffbd2e]" />
        <span className="terminal-dot bg-[#28c840]" />
        <span className="ml-3 text-[11px] text-[#4a7a4a]">{title}</span>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {children}
    </div>
  );
}

function InputRow({
  label, children, required, wide,
}: {
  label: string; children: React.ReactNode; required?: boolean; wide?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label className="text-[10px] uppercase tracking-wide text-[#4a7a4a]">
        --{label}
        {required && <span className="text-[#ff3333] ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatar: string } | null>(null);
  const [githubToken, setGithubToken] = useState<string | undefined>();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Async state
  const [fetching, setFetching] = useState(false); // fetching PR data
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = getBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/admin/");
        return;
      }
      const meta = data.session.user.user_metadata;
      setUser({
        name: meta.user_name ?? meta.login ?? "admin",
        avatar: meta.avatar_url ?? "",
      });
      // provider_token is the GitHub OAuth access token — use it for GitHub API
      // calls to get 5 000 req/hr instead of the unauthenticated 60 req/hr limit.
      setGithubToken(data.session.provider_token ?? undefined);
      loadContributions();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load contributions ─────────────────────────────────────────────────────
  const loadContributions = useCallback(async () => {
    setLoading(true);
    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from("contributions")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setContributions((data ?? []) as Contribution[]);
    setLoading(false);
  }, []);

  // ── Sign out ───────────────────────────────────────────────────────────────
  async function signOut() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/");
  }

  // ── Auto-fill from PR URL ──────────────────────────────────────────────────
  async function handleFetchPr() {
    if (!form.pr_url.trim()) return;
    if (!parsePrUrl(form.pr_url)) {
      setFetchError("Not a valid GitHub PR URL (e.g. https://github.com/owner/repo/pull/123)");
      return;
    }
    setFetching(true);
    setFetchError(null);
    const data = await fetchPrData(form.pr_url, githubToken);
    setFetching(false);
    if (!data) {
      setFetchError("Could not fetch PR — check the URL or GitHub rate limits.");
      return;
    }
    setForm((prev) => ({ ...prev, ...data }));
  }

  // ── Form helpers ───────────────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
    setFetchError(null);
    setShowForm(true);
  }

  function openEdit(c: Contribution) {
    setForm({
      pr_url: c.pr_url ?? "",
      title: c.title ?? "",
      project: c.project,
      repo_url: c.repo_url,
      description: c.description,
      status: c.status,
      type: c.type,
      language: c.language,
      stars: c.stars?.toString() ?? "",
      merged_at: c.merged_at ?? "",
      tags: c.tags.join(", "),
      issue_url: c.issue_url ?? "",
    });
    setEditingId(c.id);
    setError(null);
    setFetchError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError(null);
    setFetchError(null);
  }

  // ── Save (insert or update) ────────────────────────────────────────────────
  async function handleSave() {
    if (!form.project || !form.repo_url || !form.description) {
      setError("Project, Repo URL, and Description are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = getBrowserClient();

    const payload: Partial<Contribution> & {
      project: string; repo_url: string; description: string;
    } = {
      title: form.title.trim() || undefined,
      project: form.project.trim(),
      repo_url: form.repo_url.trim(),
      description: form.description.trim(),
      pr_url: form.pr_url.trim() || undefined,
      issue_url: form.issue_url.trim() || undefined,
      status: form.status,
      type: form.type,
      language: form.language.trim() || "Unknown",
      stars: form.stars ? parseInt(form.stars) : undefined,
      merged_at: form.merged_at || undefined,
      tags: form.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    if (editingId) {
      const { error } = await db
        .from("contributions")
        .update(payload)
        .eq("id", editingId);
      if (error) setError(error.message);
      else { closeForm(); loadContributions(); }
    } else {
      const { error } = await db.from("contributions").insert(payload);
      if (error) setError(error.message);
      else { closeForm(); loadContributions(); }
    }
    setSaving(false);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = getBrowserClient();
    await supabase.from("contributions").delete().eq("id", id);
    setDeletingId(null);
    loadContributions();
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] crt-flicker flex items-center justify-center text-xs text-[#4a7a4a]">
        <div className="crt-overlay" />
        <span className="text-[#00ff41] cursor-blink mr-2">█</span>
        authenticating...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] crt-flicker">
      {/* CRT scanline overlay */}
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Tmux-style status bar / nav ── */}
        <nav className="sticky top-0 z-20 bg-[#0a0a0a] flex items-center justify-between py-3 border-b border-[#333] text-xs">
          <div className="flex items-center gap-1">
            <span className="bg-[#00ff41] text-black px-2 py-0.5 font-bold">
              1:admin
            </span>
            <span className="text-[#4a7a4a] ml-2">
              {user?.name ?? "admin"}@oss:~/admin$
            </span>
            <span className="text-[#b0ffb0] ml-1 hidden sm:inline">
              ./manage
            </span>
            <span className="text-[#00ff41] cursor-blink ml-0.5">█</span>
          </div>
          <div className="flex items-center gap-3">
            {user?.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.name}
                width={16}
                height={16}
                className="w-4 h-4 shrink-0 bg-[#1a1a1a]"
              />
            )}
            <Link
              href="/"
              className="text-[#4a7a4a] hover:text-[#00ff41] transition-colors hidden sm:inline"
            >
              cd ../
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-[#4a7a4a] hover:text-[#ff3333] transition-colors"
            >
              <LogOut size={13} /> exit
            </button>
          </div>
        </nav>

        <div className="py-8 space-y-6">
          {/* ── Header terminal ── */}
          <TerminalWindow title={`${user?.name ?? "admin"}@oss — bash — 80×24`}>
            <div className="px-5 py-4 space-y-1 text-sm leading-relaxed">
              <div className="flex items-center gap-0">
                <span className="text-[#00ff41]">$</span>
                <span className="text-[#b0ffb0] ml-2">whoami</span>
              </div>
              <div className="text-[#00ff41] phosphor-glow font-bold">
                {user?.name ?? "admin"}
              </div>

              <div className="flex items-center gap-0 pt-2">
                <span className="text-[#00ff41]">$</span>
                <span className="text-[#b0ffb0] ml-2">
                  psql -c &quot;SELECT count(*) FROM contributions&quot;
                </span>
              </div>
              <div className="text-[#8ab88a] text-xs">
                {contributions.length}{" "}
                {contributions.length === 1 ? "row" : "rows"}
              </div>

              <div className="flex items-center justify-between gap-3 pt-3">
                <div className="flex items-center gap-0 min-w-0">
                  <span className="text-[#00ff41]">$</span>
                  <span className="text-[#b0ffb0] ml-2 truncate">
                    ./contrib new
                  </span>
                </div>
                <button onClick={openAdd} className={`${btnPrimary} shrink-0`}>
                  <Plus size={13} /> NEW ENTRY
                </button>
              </div>
            </div>
          </TerminalWindow>

          {/* ── Add / Edit form ─────────────────────────────────────────────── */}
          {showForm && (
            <TerminalWindow
              title={`nano — ${editingId ? "edit" : "new"}-contribution.yaml`}
              right={
                <button
                  onClick={closeForm}
                  className="text-[#4a7a4a] hover:text-[#ff3333] transition-colors"
                  title="Close"
                >
                  <X size={14} />
                </button>
              }
            >
              <div className="px-5 py-5 space-y-5">
                {/* ── PR URL (the magic field) ─────────────────────────────── */}
                <div className="border border-[#333] bg-[#111] p-4 space-y-3">
                  <div className="flex items-center gap-0 text-xs">
                    <span className="text-[#00ff41]">$</span>
                    <span className="text-[#b0ffb0] ml-2">
                      gh pr view --json &lt;url&gt;
                    </span>
                    <span className="text-[#2d5a2d] ml-2 hidden sm:inline">
                      # autofills every field below
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={form.pr_url}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, pr_url: e.target.value }));
                        setFetchError(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleFetchPr()}
                      placeholder="https://github.com/owner/repo/pull/123"
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      onClick={handleFetchPr}
                      disabled={fetching || !form.pr_url.trim()}
                      className={`${btnPrimary} shrink-0`}
                    >
                      {fetching ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Github size={13} />
                      )}
                      {fetching ? "FETCHING…" : "FETCH"}
                    </button>
                  </div>
                  {fetchError && (
                    <p className="text-[11px] text-[#ff3333]">
                      error: {fetchError}
                    </p>
                  )}
                </div>

                {/* ── Editable fields ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputRow label="title" required>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="fixing delayed torrent display on page opening"
                      className={inputClass}
                    />
                  </InputRow>

                  <InputRow label="project" required>
                    <input
                      value={form.project}
                      onChange={(e) => setForm((p) => ({ ...p, project: e.target.value }))}
                      placeholder="Next.js"
                      className={inputClass}
                    />
                  </InputRow>

                  <InputRow label="repo-url" required>
                    <input
                      value={form.repo_url}
                      onChange={(e) => setForm((p) => ({ ...p, repo_url: e.target.value }))}
                      placeholder="https://github.com/vercel/next.js"
                      className={inputClass}
                    />
                  </InputRow>

                  <InputRow label="issue-url">
                    <input
                      value={form.issue_url}
                      onChange={(e) => setForm((p) => ({ ...p, issue_url: e.target.value }))}
                      placeholder="https://github.com/owner/repo/issues/456"
                      className={inputClass}
                    />
                  </InputRow>

                  <InputRow label="description" required wide>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="What did you fix / add?"
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  </InputRow>

                  <InputRow label="status">
                    <select
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ContributionStatus }))}
                      className={selectClass}
                    >
                      {(["merged", "open", "closed", "reviewed"] as ContributionStatus[]).map((s) => (
                        <option key={s} value={s}>{s.toUpperCase()}</option>
                      ))}
                    </select>
                  </InputRow>

                  <InputRow label="type">
                    <select
                      value={form.type}
                      onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as ContributionType }))}
                      className={selectClass}
                    >
                      {(["bug-fix", "feature", "docs", "refactor", "test", "chore"] as ContributionType[]).map((t) => (
                        <option key={t} value={t}>{t.toUpperCase()}</option>
                      ))}
                    </select>
                  </InputRow>

                  <InputRow label="language">
                    <input
                      value={form.language}
                      onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
                      placeholder="TypeScript"
                      className={inputClass}
                    />
                  </InputRow>

                  <InputRow label="stars">
                    <input
                      type="number"
                      value={form.stars}
                      onChange={(e) => setForm((p) => ({ ...p, stars: e.target.value }))}
                      placeholder="42000"
                      className={inputClass}
                    />
                  </InputRow>

                  <InputRow label="merged-at">
                    <input
                      type="date"
                      value={form.merged_at}
                      onChange={(e) => setForm((p) => ({ ...p, merged_at: e.target.value }))}
                      className={inputClass}
                    />
                  </InputRow>

                  <InputRow label="tags">
                    <input
                      value={form.tags}
                      onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                      placeholder="routing, ssr, performance"
                      className={inputClass}
                    />
                  </InputRow>
                </div>

                {error && (
                  <p className="text-[11px] text-[#ff3333] border border-[#ff3333]/30 bg-[#1a0a0a] px-3 py-2">
                    error: {error}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={btnPrimary}
                  >
                    {saving ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Check size={13} />
                    )}
                    {saving ? "WRITING…" : editingId ? "UPDATE" : "SAVE"}
                  </button>
                  <button onClick={closeForm} className={btnGhost}>
                    <X size={13} /> CANCEL
                  </button>
                </div>
              </div>
            </TerminalWindow>
          )}

          {/* ── Contributions list ──────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-[#00ff41] text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="cursor-blink">█</span>
                <span>Fetching contributions from database...</span>
              </div>
              <div className="text-[10px] text-[#2d5a2d]">
                SELECT * FROM contributions ORDER BY created_at DESC;
              </div>
            </div>
          ) : contributions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#4a7a4a] text-xs space-y-2">
              <div>$ ls ./contributions</div>
              <div className="text-[#ff3333]">error: directory is empty</div>
              <div className="text-[#2d5a2d]">
                Run &quot;NEW ENTRY&quot; to add your first contribution.
              </div>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#333] border-b-0 text-[10px] text-[#4a7a4a]">
                <span>drwxr-xr-x</span>
                <span className="text-[#00ff41]">./contributions</span>
                <span className="ml-auto text-[#2d5a2d]">
                  ({contributions.length}{" "}
                  {contributions.length === 1 ? "entry" : "entries"})
                </span>
              </div>

              {/* Rows */}
              <div className="border border-[#333] border-t-[#1a1a1a] divide-y divide-[#1a1a1a]">
                {contributions.map((c) => {
                  const pr = c.pr_url ? parsePrUrl(c.pr_url) : null;
                  return (
                    <div
                      key={c.id}
                      className="group flex items-center gap-2 border-l-2 border-transparent hover:border-[#00ff41] px-3 py-2 hover:bg-[#0d1a0d] transition-all row-scanline text-xs"
                    >
                      {/* Status bracket badge */}
                      <span className={`font-bold shrink-0 ${statusColor[c.status]}`}>
                        [{c.status.toUpperCase()}]
                      </span>

                      {/* PR number */}
                      {pr && (
                        <span className="text-[#4a7a4a] shrink-0 hidden sm:inline">
                          #{pr.number}
                        </span>
                      )}

                      <span className="text-[#333] shrink-0 hidden sm:inline">—</span>

                      {/* Title */}
                      <span className="text-[#b0ffb0] group-hover:text-[#00ff41] transition-colors truncate min-w-0 flex-1">
                        {c.title || c.description || c.project}
                      </span>

                      {/* Type badge */}
                      <span
                        className={`shrink-0 hidden md:inline ${
                          typeColor[c.type] ?? "text-[#4a7a4a]"
                        }`}
                      >
                        [{c.type.toUpperCase()}]
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {c.pr_url && (
                          <a
                            href={c.pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-[#2d5a2d] hover:text-[#00ff41] transition-colors"
                            title="View PR"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1 text-[#2d5a2d] hover:text-[#00ff41] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`rm -f "${c.project}" — are you sure?`)) handleDelete(c.id);
                          }}
                          disabled={deletingId === c.id}
                          className="p-1 text-[#2d5a2d] hover:text-[#ff3333] transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === c.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Terminal status bar footer ── */}
        <footer className="border-t border-[#333] py-4 text-[11px] text-[#2d5a2d] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span>
              SESSION: <span className="text-[#00ff41]">authenticated</span>
            </span>
            <span className="text-[#333]">│</span>
            <span>
              CONN: supabase <span className="text-[#00ff41]">●</span>
            </span>
            <span className="text-[#333]">│</span>
            <span>MODE: rw</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{contributions.length} rows</span>
            <span className="text-[#333]">│</span>
            <span>EOF</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
