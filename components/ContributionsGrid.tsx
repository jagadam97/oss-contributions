"use client";
import { useState, useMemo, useEffect } from "react";
import { Contribution } from "@/lib/types";
import { ContributionCard } from "./ContributionCard";
import { FilterBar, Filters } from "./FilterBar";
import { StatsBar } from "./StatsBar";
import { getBrowserClient } from "@/lib/supabase-browser";

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
      <div className="flex flex-col items-center justify-center py-32 text-[#00ff41] text-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="cursor-blink">█</span>
          <span>Fetching contributions from database...</span>
        </div>
        <div className="text-[10px] text-[#2d5a2d]">
          SELECT * FROM contributions;
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <StatsBar contributions={contributions} />

      <FilterBar filters={filters} onChange={setFilters} />

      {grouped.size === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#4a7a4a] text-xs space-y-2">
          <div>$ find ./contributions -name &quot;*&quot; | grep -i &quot;{filters.search || "..."}&quot;</div>
          <div className="text-[#ff3333]">error: no matches found</div>
          <div className="text-[#2d5a2d]">Try adjusting your filters.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([repoUrl, items]) => {
            const first    = items[0];
            const repoName = first.project;
            // Extract owner from repo URL e.g. https://github.com/owner/repo
            const owner    = repoUrl.match(/github\.com\/([^/]+)/)?.[1];
            const avatarUrl = owner ? `https://github.com/${owner}.png?size=40` : null;

            return (
              <div key={repoUrl}>
                {/* ── Directory-path style repo group header ── */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#333] border-b-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={owner}
                      width={16}
                      height={16}
                      className="w-4 h-4 shrink-0 bg-[#1a1a1a]"
                      style={{ imageRendering: "auto" }}
                    />
                  ) : (
                    <span className="w-4 h-4 bg-[#1a1a1a] flex items-center justify-center text-[9px] font-bold text-[#4a7a4a] shrink-0">
                      {repoName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#00ff41] hover:underline flex items-center gap-1"
                  >
                    <span className="text-[#4a7a4a]">drwxr-xr-x</span>
                    <span className="text-[#00cc33]">{owner}/</span>
                    <span className="text-[#00ff41] font-bold">{repoName}/</span>
                  </a>
                  <span className="ml-auto text-[10px] text-[#2d5a2d]">
                    ({items.length} {items.length === 1 ? "entry" : "entries"})
                  </span>
                </div>

                {/* ── PR rows (git log style) ── */}
                <div className="border border-[#333] border-t-[#1a1a1a] divide-y divide-[#1a1a1a]">
                  {items.map((c) => (
                    <ContributionCard key={c.id} c={c} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center text-[10px] text-[#2d5a2d] pt-2">
        ── {totalFiltered} of {contributions.length} contributions ── EOF
      </div>
    </section>
  );
}
