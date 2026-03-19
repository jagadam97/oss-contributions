"use client";
import { Contribution } from "@/lib/types";

const statusConfig = {
  merged:   { color: "text-[#a855f7]", label: "MERGED"   },
  open:     { color: "text-[#00ff41]", label: "OPEN"     },
  closed:   { color: "text-[#ff3333]", label: "CLOSED"   },
  reviewed: { color: "text-[#3b82f6]", label: "REVIEWED" },
};

const typeConfig: Record<string, { color: string; label: string }> = {
  "bug-fix":  { color: "text-[#ff3333]", label: "BUG-FIX"  },
  feature:    { color: "text-[#00ff41]", label: "FEATURE"   },
  docs:       { color: "text-[#ffb800]", label: "DOCS"      },
  refactor:   { color: "text-[#38bdf8]", label: "REFACTOR"  },
  test:       { color: "text-[#2dd4bf]", label: "TEST"      },
  chore:      { color: "text-[#4a7a4a]", label: "CHORE"     },
};

/** Extract owner/repo/number from a GitHub PR URL */
function parsePrUrl(url: string) {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2], number: m[3] };
}

function timeAgo(dateStr: string) {
  const diff   = Date.now() - new Date(dateStr).getTime();
  const mins   = Math.floor(diff / 60000);
  const hours  = Math.floor(diff / 3600000);
  const days   = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  const years  = Math.floor(days / 365);
  if (years  >= 1) return `${years}y ago`;
  if (months >= 1) return `${months}mo ago`;
  if (days   >= 1) return `${days}d ago`;
  if (hours  >= 1) return `${hours}h ago`;
  return `${mins}m ago`;
}

export function ContributionCard({ c }: { c: Contribution }) {
  const { color: statusColor, label: statusLabel } = statusConfig[c.status];
  const typeInfo = typeConfig[c.type];
  const pr       = c.pr_url ? parsePrUrl(c.pr_url) : null;
  const prNum    = pr ? `#${pr.number}` : null;
  const dateStr  = c.merged_at ?? c.created_at;
  const ago      = timeAgo(dateStr);

  return (
    <a
      href={c.pr_url ?? c.repo_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start sm:items-center gap-2 border-l-2 border-transparent hover:border-[#00ff41] px-3 py-2 hover:bg-[#0d1a0d] transition-all row-scanline text-xs"
    >
      {/* Status bracket badge */}
      <span className={`font-bold shrink-0 ${statusColor}`}>
        [{statusLabel}]
      </span>

      {/* PR number */}
      {prNum && (
        <span className="text-[#4a7a4a] shrink-0">
          {prNum}
        </span>
      )}

      {/* Separator */}
      <span className="text-[#333] shrink-0">—</span>

      {/* Title */}
      <span className="text-[#b0ffb0] group-hover:text-[#00ff41] transition-colors truncate min-w-0 flex-1">
        {c.title || c.description || c.project}
      </span>

      {/* Type badge */}
      {typeInfo && (
        <span className={`shrink-0 hidden sm:inline ${typeInfo.color}`}>
          [{typeInfo.label}]
        </span>
      )}

      {/* Time */}
      <span className="text-[#2d5a2d] shrink-0 hidden sm:inline">
        · {ago}
      </span>
    </a>
  );
}
