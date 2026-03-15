"use client";
import { ContributionType } from "@/lib/types";
import { Bug, Zap, BookOpen, RefreshCw, TestTube, Settings } from "lucide-react";

const config: Record<
  ContributionType,
  { label: string; color: string; Icon: React.ElementType }
> = {
  "bug-fix": {
    label: "Bug Fix",
    color: "bg-red-500/10 text-red-300 border-red-500/20",
    Icon: Bug,
  },
  feature: {
    label: "Feature",
    color: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    Icon: Zap,
  },
  docs: {
    label: "Docs",
    color: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    Icon: BookOpen,
  },
  refactor: {
    label: "Refactor",
    color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    Icon: RefreshCw,
  },
  test: {
    label: "Test",
    color: "bg-teal-500/10 text-teal-300 border-teal-500/20",
    Icon: TestTube,
  },
  chore: {
    label: "Chore",
    color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    Icon: Settings,
  },
};

export function TypeBadge({ type }: { type: ContributionType }) {
  const { label, color, Icon } = config[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}
