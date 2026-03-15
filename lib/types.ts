export type ContributionStatus = "merged" | "open" | "closed" | "reviewed";
export type ContributionType = "bug-fix" | "feature" | "docs" | "refactor" | "test" | "chore";

export interface Contribution {
  id: string;
  project: string;
  repo_url: string;
  title?: string;
  description: string;
  pr_url?: string;
  issue_url?: string;
  status: ContributionStatus;
  type: ContributionType;
  language: string;
  stars?: number;
  merged_at?: string;
  created_at: string;
  tags: string[];
}
