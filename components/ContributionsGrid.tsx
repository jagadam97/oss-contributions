"use client";
import { useState, useMemo } from "react";
import { Contribution } from "@/lib/types";
import { ContributionCard } from "./ContributionCard";
import { FilterBar, Filters } from "./FilterBar";
import { StatsBar } from "./StatsBar";

export function ContributionsGrid({
  contributions,
}: {
  contributions: Contribution[];
}) {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    type: "all",
  });

  const filtered = useMemo(() => {
    return contributions.filter((c) => {
      if (filters.status !== "all" && c.status !== filters.status) return false;
      if (filters.type !== "all" && c.type !== filters.type) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          c.project.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.language.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [contributions, filters]);

  return (
    <section className="space-y-8">
      <StatsBar contributions={contributions} />

      <FilterBar filters={filters} onChange={setFilters} />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-sm">No contributions match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <ContributionCard key={c.id} c={c} />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-slate-600 pt-4">
        Showing {filtered.length} of {contributions.length} contributions
      </p>
    </section>
  );
}
