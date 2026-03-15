"use client";
import { Contribution } from "@/lib/types";
import { GitMerge, GitPullRequest, XCircle, Eye, ExternalLink } from "lucide-react";

const statusConfig = {
  merged:   { Icon: GitMerge,      color: "text-purple-400", label: "Merged" },
  open:     { Icon: GitPullRequest, color: "text-green-400",  label: "Open"   },
  closed:   { Icon: XCircle,        color: "text-slate-500",  label: "Closed" },
  reviewed: { Icon: Eye,            color: "text-blue-400",   label: "Reviewed" },
};

/** Extract owner/repo and PR number from a GitHub PR URL */
function parsePrUrl(url: string) {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2], number: m[3] };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  const months= Math.floor(days / 30);
  const years = Math.floor(days / 365);
  if (years  >= 1) return `${years} year${years  > 1 ? "s" : ""} ago`;
  if (months >= 1) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (days   >= 1) return `${days} day${days   > 1 ? "s" : ""} ago`;
  if (hours  >= 1) return `${hours} hour${hours  > 1 ? "s" : ""} ago`;
  return `${mins} minute${mins > 1 ? "s" : ""} ago`;
}

export function ContributionCard({ c }: { c: Contribution }) {
  const { Icon, color, label } = statusConfig[c.status];
  const pr      = c.pr_url ? parsePrUrl(c.pr_url) : null;
  const prNum   = pr ? `#${pr.number}` : null;
  const dateStr = c.merged_at ?? c.created_at;
  const ago     = timeAgo(dateStr);
  const verb    = c.status === "merged" ? "Merged" : c.status === "open" ? "Opened" : "Closed";

  return (
    <a
      href={c.pr_url ?? c.repo_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-xl border border-slate-800 bg-[#0f0f1a] px-4 py-3.5 hover:border-slate-600 hover:bg-[#13131f] transition-all"
    >
      {/* Repo avatar — GitHub-style coloured circle with first letter */}
      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-sm font-bold text-slate-300 group-hover:border-slate-500 transition-colors">
        {c.project.charAt(0).toUpperCase()}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-100 group-hover:text-white transition-colors truncate">
            {c.title || c.description || c.project}
          </span>
          {/* Status pill — inline like GitHub */}
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${color} shrink-0`}>
            <Icon size={12} />
            {label}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 flex-wrap">
          <Icon size={11} className={color} />
          {prNum && <span className="text-slate-400">{prNum}</span>}
          {prNum && <span>·</span>}
          <span>{verb} {ago}</span>
        </div>
      </div>

      {/* Right: external link icon */}
      <ExternalLink
        size={14}
        className="text-slate-700 group-hover:text-slate-400 transition-colors shrink-0"
      />
    </a>
  );
}
