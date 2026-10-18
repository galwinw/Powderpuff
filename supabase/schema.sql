-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
-- It creates one table that holds the playbook, roster and team settings.
-- Everyone can read it; only logged-in users (your coaches) can change it.

create table if not exists public.team_docs (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.team_docs enable row level security;

drop policy if exists "Anyone can read the team docs" on public.team_docs;
create policy "Anyone can read the team docs"
  on public.team_docs for select
  using (true);

drop policy if exists "Coaches can add team docs" on public.team_docs;
create policy "Coaches can add team docs"
  on public.team_docs for insert
  to authenticated
  with check (key in ('playbook', 'roster', 'settings'));

drop policy if exists "Coaches can update team docs" on public.team_docs;
create policy "Coaches can update team docs"
  on public.team_docs for update
  to authenticated
  using (true)
  with check (key in ('playbook', 'roster', 'settings'));
