"use client";
import { ContributionStatus, ContributionType } from "@/lib/types";
import { Search, X } from "lucide-react";

export interface Filters {
  search: string;
  status: ContributionStatus | "all";
  type: ContributionType | "all";
}

interface FilterBarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const statuses: Array<{ value: ContributionStatus | "all"; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "merged", label: "Merged" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "reviewed", label: "Reviewed" },
];

const types: Array<{ value: ContributionType | "all"; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "bug-fix", label: "Bug Fix" },
  { value: "feature", label: "Feature" },
  { value: "docs", label: "Docs" },
  { value: "refactor", label: "Refactor" },
  { value: "test", label: "Test" },
  { value: "chore", label: "Chore" },
];

const selectClass =
  "bg-[#0f0f1a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer";

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const hasActiveFilters =
    filters.search || filters.status !== "all" || filters.type !== "all";

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search projects, descriptions, tags..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full bg-[#0f0f1a] border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) =>
          onChange({
            ...filters,
            status: e.target.value as ContributionStatus | "all",
          })
        }
        className={selectClass}
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Type filter */}
      <select
        value={filters.type}
        onChange={(e) =>
          onChange({
            ...filters,
            type: e.target.value as ContributionType | "all",
          })
        }
        className={selectClass}
      >
        {types.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={() => onChange({ search: "", status: "all", type: "all" })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors border border-slate-700"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}
