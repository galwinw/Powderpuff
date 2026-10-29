-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run.
-- It creates one table that holds the playbook, roster and team settings.
-- Honor system: anyone with the app can read it, and anyone in coach mode can save to it.

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
drop policy if exists "Coaches can update team docs" on public.team_docs;
drop policy if exists "Team can add team docs" on public.team_docs;
drop policy if exists "Team can update team docs" on public.team_docs;

create policy "Team can add team docs"
  on public.team_docs for insert
  to anon, authenticated
  with check (key in ('playbook', 'roster', 'settings'));

create policy "Team can update team docs"
  on public.team_docs for update
  to anon, authenticated
  using (true)
  with check (key in ('playbook', 'roster', 'settings'));
