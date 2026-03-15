-- Contributions table for jagadam97/oss-contributions
-- Run this in your Supabase SQL editor to set up the database.

create type contribution_status as enum ('merged', 'open', 'closed', 'reviewed');
create type contribution_type as enum ('bug-fix', 'feature', 'docs', 'refactor', 'test', 'chore');

create table if not exists contributions (
  id          uuid primary key default gen_random_uuid(),
  project     text not null,
  repo_url    text not null,
  description text not null,
  pr_url      text,
  issue_url   text,
  status      contribution_status not null default 'open',
  type        contribution_type   not null default 'feature',
  language    text not null default 'TypeScript',
  stars       integer,
  merged_at   date,
  created_at  timestamptz not null default now(),
  tags        text[] not null default '{}'
);

-- Enable Row Level Security (public read-only)
alter table contributions enable row level security;

create policy "Public read access"
  on contributions for select
  using (true);

-- Index for common filters
create index contributions_status_idx on contributions(status);
create index contributions_type_idx   on contributions(type);
create index contributions_created_at_idx on contributions(created_at desc);
