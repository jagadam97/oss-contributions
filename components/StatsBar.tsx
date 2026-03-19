"use client";
import { Contribution } from "@/lib/types";

function AsciiBar({ value, max, width = 12 }: { value: number; max: number; width?: number }) {
  const filled = max > 0 ? Math.round((value / max) * width) : 0;
  const empty = width - filled;
  return (
    <span className="text-[11px]">
      [<span className="text-[#00ff41]">{"█".repeat(filled)}</span>
      <span className="text-[#1a3a1a]">{"░".repeat(empty)}</span>]
    </span>
  );
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k+`;
  return String(n);
}

export function StatsBar({ contributions }: { contributions: Contribution[] }) {
  const merged = contributions.filter((c) => c.status === "merged").length;
  const open = contributions.filter((c) => c.status === "open").length;
  const languages = new Set(contributions.map((c) => c.language)).size;
  // Deduplicate by repo_url so multiple PRs in the same repo count once
  const seenRepos = new Set<string>();
  const totalStars = contributions.reduce((acc, c) => {
    if (!c.stars || seenRepos.has(c.repo_url)) return acc;
    seenRepos.add(c.repo_url);
    return acc + c.stars;
  }, 0);

  const total = contributions.length;

  return (
    <div className="border border-[#333] bg-[#0a0a0a]">
      {/* Title bar */}
      <div className="px-4 py-1.5 bg-[#111] border-b border-[#333] text-[11px] text-[#4a7a4a] flex items-center justify-between">
        <span>┌─ system-stats ─────────────────────┐</span>
        <span className="text-[#00ff41]">htop</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#1a1a1a]">
        {/* Merged */}
        <div className="px-4 py-3 space-y-1">
          <div className="text-[10px] text-[#4a7a4a] uppercase tracking-wider">Merged</div>
          <div className="text-lg font-bold text-[#00ff41] phosphor-glow">{merged}</div>
          <AsciiBar value={merged} max={total} />
        </div>

        {/* Open */}
        <div className="px-4 py-3 space-y-1">
          <div className="text-[10px] text-[#4a7a4a] uppercase tracking-wider">Open</div>
          <div className="text-lg font-bold text-[#ffb800]">{open}</div>
          <AsciiBar value={open} max={total} />
        </div>

        {/* Languages */}
        <div className="px-4 py-3 space-y-1">
          <div className="text-[10px] text-[#4a7a4a] uppercase tracking-wider">Langs</div>
          <div className="text-lg font-bold text-[#00cc33]">{languages}</div>
          <AsciiBar value={languages} max={20} />
        </div>

        {/* Stars */}
        <div className="px-4 py-3 space-y-1">
          <div className="text-[10px] text-[#4a7a4a] uppercase tracking-wider">★ Stars</div>
          <div className="text-lg font-bold text-[#ffb800]">{formatStars(totalStars)}</div>
          <AsciiBar value={Math.min(totalStars, 100000)} max={100000} />
        </div>
      </div>

      {/* Bottom border */}
      <div className="px-4 py-1 bg-[#111] border-t border-[#333] text-[10px] text-[#2d5a2d]">
        └─ {total} total contributions ─────────┘
      </div>
    </div>
  );
}
