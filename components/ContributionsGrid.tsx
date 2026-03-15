"use client";
import { useState, useMemo, useEffect } from "react";
import { Contribution } from "@/lib/types";
import { ContributionCard } from "./ContributionCard";
import { FilterBar, Filters } from "./FilterBar";
import { StatsBar } from "./StatsBar";
import { getBrowserClient } from "@/lib/supabase-browser";
import { Loader2, ExternalLink } from "lucide-react";

// ── Sort order: open first, then merged (newest first), then closed/reviewed last
const STATUS_PRIORITY: Record<string, number> = {
  open:     0,
  reviewed: 1,
  merged:   2,
  closed:   3,
};

function sortContributions(list: Contribution[]): Contribution[] {
  return [...list].sort((a, b) => {
    // Primary: status priority
    const sp = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (sp !== 0) return sp;
    // Secondary: most recently merged/created first
    const da = new Date(a.merged_at ?? a.created_at).getTime();
    const db = new Date(b.merged_at ?? b.created_at).getTime();
    return db - da;
  });
}

/** Group a sorted list by repo_url, preserving the order repos first appear */
function groupByRepo(list: Contribution[]): Map<string, Contribution[]> {
  const map = new Map<string, Contribution[]>();
  for (const c of list) {
    const key = c.repo_url;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return map;
}

export function ContributionsGrid() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    type: "all",
  });

  useEffect(() => {
    const supabase = getBrowserClient();
    supabase
      .from("contributions")
      .select("*")
      .then(({ data }) => {
        setContributions((data as Contribution[]) ?? []);
        setLoading(false);
      });
  }, []);

  const grouped = useMemo(() => {
    const filtered = contributions.filter((c) => {
      if (filters.status !== "all" && c.status !== filters.status) return false;
      if (filters.type !== "all" && c.type !== filters.type) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          c.project.toLowerCase().includes(q) ||
          c.title?.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.language.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return groupByRepo(sortContributions(filtered));
  }, [contributions, filters]);

  const totalFiltered = useMemo(
    () => [...grouped.values()].reduce((s, v) => s + v.length, 0),
    [grouped]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <StatsBar contributions={contributions} />

      <FilterBar filters={filters} onChange={setFilters} />

      {grouped.size === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-sm">No contributions match your filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([repoUrl, items]) => {
            const first    = items[0];
            const repoName = first.project;
            // Extract owner from repo URL e.g. https://github.com/owner/repo
            const owner    = repoUrl.match(/github\.com\/([^/]+)/)?.[1];
            const avatarUrl = owner ? `https://github.com/${owner}.png?size=40` : null;

            return (
              <div key={repoUrl} className="space-y-1.5">
                {/* Repo group header */}
                <div className="flex items-center gap-2 px-1 pb-1 border-b border-slate-800">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={owner}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-sm border border-slate-700 shrink-0 bg-slate-800"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-sm bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
                      {repoName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-slate-300 hover:text-indigo-300 transition-colors flex items-center gap-1"
                  >
                    {repoName}
                    <ExternalLink size={11} className="opacity-50" />
                  </a>
                  <span className="ml-auto text-xs text-slate-600">
                    {items.length} PR{items.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* PR rows */}
                <div className="flex flex-col gap-1.5 pl-1">
                  {items.map((c) => (
                    <ContributionCard key={c.id} c={c} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-slate-600 pt-4">
        Showing {totalFiltered} of {contributions.length} contributions
      </p>
    </section>
  );
}
