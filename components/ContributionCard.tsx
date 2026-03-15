"use client";
import { Contribution } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { TypeBadge } from "./TypeBadge";
import {
  ExternalLink,
  Star,
  GitPullRequest,
  Calendar,
} from "lucide-react";

function LanguageDot({ lang }: { lang: string }) {
  const colors: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f7df1e",
    Python: "#3572A5",
    Go: "#00ADD8",
    Rust: "#dea584",
    Markdown: "#083fa1",
    default: "#8b5cf6",
  };
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: colors[lang] ?? colors.default }}
    />
  );
}

export function ContributionCard({ c }: { c: Contribution }) {
  const date = c.merged_at ?? c.created_at;
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <article className="card-hover group relative flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#0f0f1a] p-5">
      {/* Subtle top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <a
            href={c.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-slate-100 hover:text-indigo-300 transition-colors"
          >
            {c.project}
            <ExternalLink size={13} className="flex-shrink-0 opacity-60" />
          </a>
        </div>
        <StatusBadge status={c.status} />
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 leading-relaxed flex-1">
        {c.description}
      </p>

      {/* Tags */}
      {c.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {c.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md text-xs text-slate-500 bg-slate-800/60 border border-slate-700/50"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <LanguageDot lang={c.language} />
            {c.language}
          </span>
          {c.stars !== undefined && (
            <span className="flex items-center gap-1">
              <Star size={11} />
              {c.stars >= 1000
                ? `${(c.stars / 1000).toFixed(1)}k`
                : c.stars}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {formattedDate}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TypeBadge type={c.type} />
          {c.pr_url && (
            <a
              href={c.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-300 transition-colors"
              title="View PR"
            >
              <GitPullRequest size={13} />
              PR
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
