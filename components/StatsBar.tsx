"use client";
import { Contribution } from "@/lib/types";
import { GitMerge, GitPullRequest, Code2, Star } from "lucide-react";

export function StatsBar({ contributions }: { contributions: Contribution[] }) {
  const merged = contributions.filter((c) => c.status === "merged").length;
  const open = contributions.filter((c) => c.status === "open").length;
  const languages = new Set(contributions.map((c) => c.language)).size;
  const totalStars = contributions.reduce((acc, c) => acc + (c.stars ?? 0), 0);

  const stats = [
    { label: "Merged PRs", value: merged, Icon: GitMerge, color: "text-purple-400" },
    { label: "Open PRs", value: open, Icon: GitPullRequest, color: "text-green-400" },
    { label: "Languages", value: languages, Icon: Code2, color: "text-cyan-400" },
    {
      label: "Combined Stars",
      value: totalStars >= 1000 ? `${(totalStars / 1000).toFixed(0)}k+` : totalStars,
      Icon: Star,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ label, value, Icon, color }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-[#0f0f1a] p-5"
        >
          <Icon size={20} className={color} />
          <span className={`text-2xl font-bold ${color}`}>{value}</span>
          <span className="text-xs text-slate-500 text-center">{label}</span>
        </div>
      ))}
    </div>
  );
}
