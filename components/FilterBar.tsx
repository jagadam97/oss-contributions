"use client";
import { ContributionStatus, ContributionType } from "@/lib/types";
import { X } from "lucide-react";

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
  { value: "all", label: "ALL STATUS" },
  { value: "merged", label: "MERGED" },
  { value: "open", label: "OPEN" },
  { value: "closed", label: "CLOSED" },
  { value: "reviewed", label: "REVIEWED" },
];

const types: Array<{ value: ContributionType | "all"; label: string }> = [
  { value: "all", label: "ALL TYPES" },
  { value: "bug-fix", label: "BUG-FIX" },
  { value: "feature", label: "FEATURE" },
  { value: "docs", label: "DOCS" },
  { value: "refactor", label: "REFACTOR" },
  { value: "test", label: "TEST" },
  { value: "chore", label: "CHORE" },
];

const selectClass =
  "bg-[#0a0a0a] border border-[#333] px-3 py-2 text-xs text-[#b0ffb0] focus:border-[#00ff41] terminal-glow transition-colors cursor-pointer";

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const hasActiveFilters =
    filters.search || filters.status !== "all" || filters.type !== "all";

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Search — styled as command prompt */}
      <div className="relative flex-1 flex items-center border border-[#333] bg-[#0a0a0a] px-3 py-2 focus-within:border-[#00ff41] transition-colors group">
        <span className="text-[#00ff41] text-xs mr-2 shrink-0">
          &gt;
        </span>
        <input
          type="text"
          placeholder="search_"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="flex-1 bg-transparent text-xs text-[#b0ffb0] focus:outline-none placeholder:text-[#2d5a2d]"
        />
        <span className="text-[#00ff41] cursor-blink text-xs">█</span>
      </div>

      {/* Status filter */}
      <div className="flex items-center border border-[#333] bg-[#0a0a0a] px-1">
        <span className="text-[10px] text-[#4a7a4a] px-2 shrink-0">STATUS:</span>
        <select
          value={filters.status}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value as ContributionStatus | "all",
            })
          }
          className="bg-transparent border-none px-2 py-2 text-xs text-[#00ff41] focus:outline-none cursor-pointer"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Type filter */}
      <div className="flex items-center border border-[#333] bg-[#0a0a0a] px-1">
        <span className="text-[10px] text-[#4a7a4a] px-2 shrink-0">TYPE:</span>
        <select
          value={filters.type}
          onChange={(e) =>
            onChange({
              ...filters,
              type: e.target.value as ContributionType | "all",
            })
          }
          className="bg-transparent border-none px-2 py-2 text-xs text-[#00ff41] focus:outline-none cursor-pointer"
        >
          {types.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={() => onChange({ search: "", status: "all", type: "all" })}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#ff3333] hover:text-[#ff6666] hover:bg-[#1a0a0a] transition-colors border border-[#333]"
        >
          <X size={12} />
          CLEAR
        </button>
      )}
    </div>
  );
}
