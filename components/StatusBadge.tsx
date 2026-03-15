"use client";
import { ContributionStatus } from "@/lib/types";
import { GitMerge, GitPullRequest, XCircle, Eye } from "lucide-react";

const config: Record<
  ContributionStatus,
  { label: string; color: string; Icon: React.ElementType }
> = {
  merged: {
    label: "Merged",
    color: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    Icon: GitMerge,
  },
  open: {
    label: "Open",
    color: "bg-green-500/15 text-green-300 border-green-500/30",
    Icon: GitPullRequest,
  },
  closed: {
    label: "Closed",
    color: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    Icon: XCircle,
  },
  reviewed: {
    label: "Reviewed",
    color: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    Icon: Eye,
  },
};

export function StatusBadge({ status }: { status: ContributionStatus }) {
  const { label, color, Icon } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}
