"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";
import type { Contribution, ContributionStatus, ContributionType } from "@/lib/types";
import {
  LogOut, Plus, Trash2, Pencil, X, Check,
  Loader2, ExternalLink, Github, Sparkles,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type FormState = {
  pr_url: string;
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

async function fetchPrData(prUrl: string): Promise<Partial<FormState> | null> {
  const parsed = parsePrUrl(prUrl);
  if (!parsed) return null;

  const { owner, repo, number } = parsed;

  // Fetch PR + repo in parallel
  const [prRes, repoRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`, {
      headers: { Accept: "application/vnd.github+json" },
    }),
    fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: "application/vnd.github+json" },
    }),
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
    project: repoData?.name ?? repo,
    repo_url: `https://github.com/${owner}/${repo}`,
    description: pr.body
      ? pr.body.replace(/<!--[\s\S]*?-->/g, "").trim().slice(0, 300)
      : pr.title ?? "",
    status,
    type,
    language: repoData?.language ?? "",
    stars: repoData?.stargazers_count?.toString() ?? "",
    merged_at: pr.merged_at ? pr.merged_at.split("T")[0] : "",
    tags,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InputRow({
  label, children, required,
}: {
  label: string; children: React.ReactNode; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-[#0a0a0f] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors";

const selectClass =
  "w-full bg-[#0a0a0f] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors";

// ─── Main page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatar: string } | null>(null);
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
    const data = await fetchPrData(form.pr_url);
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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-slate-800 bg-[#0a0a0f]/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">jagadam97 /</span>
            <span className="font-medium">oss-contributions</span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 text-xs border border-indigo-500/20">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                {user.avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="hidden sm:inline">{user.name}</span>
              </div>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Contributions</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {contributions.length} total
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Add contribution
          </button>
        </div>

        {/* ── Add / Edit form ─────────────────────────────────────────────── */}
        {showForm && (
          <div className="rounded-2xl border border-indigo-500/30 bg-[#0f0f1a] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-100">
                {editingId ? "Edit contribution" : "Add contribution"}
              </h2>
              <button
                onClick={closeForm}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── PR URL (the magic field) ─────────────────────────────── */}
            <div className="rounded-xl border border-slate-700 bg-[#0a0a0f] p-4 space-y-3">
              <p className="text-xs font-medium text-indigo-300 flex items-center gap-1.5">
                <Sparkles size={12} /> Paste a PR URL to auto-fill everything
              </p>
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {fetching ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Github size={14} />
                  )}
                  {fetching ? "Fetching…" : "Fetch"}
                </button>
              </div>
              {fetchError && (
                <p className="text-xs text-red-400">{fetchError}</p>
              )}
            </div>

            {/* ── Editable fields ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputRow label="Project name" required>
                <input
                  value={form.project}
                  onChange={(e) => setForm((p) => ({ ...p, project: e.target.value }))}
                  placeholder="Next.js"
                  className={inputClass}
                />
              </InputRow>

              <InputRow label="Repo URL" required>
                <input
                  value={form.repo_url}
                  onChange={(e) => setForm((p) => ({ ...p, repo_url: e.target.value }))}
                  placeholder="https://github.com/vercel/next.js"
                  className={inputClass}
                />
              </InputRow>

              <InputRow label="Description" required>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What did you fix / add?"
                  rows={3}
                  className={`${inputClass} resize-none col-span-full`}
                />
              </InputRow>

              <InputRow label="Status">
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ContributionStatus }))}
                  className={selectClass}
                >
                  {(["merged", "open", "closed", "reviewed"] as ContributionStatus[]).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </InputRow>

              <InputRow label="Type">
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as ContributionType }))}
                  className={selectClass}
                >
                  {(["bug-fix", "feature", "docs", "refactor", "test", "chore"] as ContributionType[]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </InputRow>

              <InputRow label="Language">
                <input
                  value={form.language}
                  onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
                  placeholder="TypeScript"
                  className={inputClass}
                />
              </InputRow>

              <InputRow label="Stars">
                <input
                  type="number"
                  value={form.stars}
                  onChange={(e) => setForm((p) => ({ ...p, stars: e.target.value }))}
                  placeholder="42000"
                  className={inputClass}
                />
              </InputRow>

              <InputRow label="Merged at">
                <input
                  type="date"
                  value={form.merged_at}
                  onChange={(e) => setForm((p) => ({ ...p, merged_at: e.target.value }))}
                  className={inputClass}
                />
              </InputRow>

              <InputRow label="Tags (comma-separated)">
                <input
                  value={form.tags}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="routing, ssr, performance"
                  className={inputClass}
                />
              </InputRow>

              <InputRow label="Issue URL">
                <input
                  value={form.issue_url}
                  onChange={(e) => setForm((p) => ({ ...p, issue_url: e.target.value }))}
                  placeholder="https://github.com/owner/repo/issues/456"
                  className={inputClass}
                />
              </InputRow>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {saving ? "Saving…" : editingId ? "Update" : "Save"}
              </button>
              <button
                onClick={closeForm}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:text-slate-200 hover:border-slate-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Contributions list ──────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-indigo-400" />
          </div>
        ) : contributions.length === 0 ? (
          <div className="text-center py-20 text-slate-600 text-sm">
            No contributions yet. Hit &ldquo;Add contribution&rdquo; to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {contributions.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 rounded-xl border border-slate-800 bg-[#0f0f1a] px-4 py-3 hover:border-slate-700 transition-colors"
              >
                {/* Status dot */}
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    c.status === "merged"
                      ? "bg-purple-400"
                      : c.status === "open"
                      ? "bg-green-400"
                      : "bg-slate-500"
                  }`}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {c.project}
                    </span>
                    <span className="text-xs text-slate-500 shrink-0">
                      {c.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {c.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {c.pr_url && (
                    <a
                      href={c.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                      title="View PR"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${c.project}"?`)) handleDelete(c.id);
                    }}
                    disabled={deletingId === c.id}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === c.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
