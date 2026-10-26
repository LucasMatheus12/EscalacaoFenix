create table if not exists public.game_sessions (
  game_type text primary key check (game_type in ('quadra', 'campo')),
  players jsonb not null default '[]'::jsonb,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.game_sessions (game_type, players, config)
values
  ('quadra', '[]'::jsonb, '{"teamCount": 3, "playersPerTeam": 6}'::jsonb),
  ('campo', '[]'::jsonb, '{"teamCount": 3, "playersPerTeam": 6}'::jsonb)
on conflict (game_type) do nothing;

alter table public.game_sessions enable row level security;

drop policy if exists "Anyone can read sessions" on public.game_sessions;
drop policy if exists "Anyone can insert sessions" on public.game_sessions;
drop policy if exists "Anyone can update sessions" on public.game_sessions;
drop policy if exists "Anyone can delete sessions" on public.game_sessions;

create policy "Anyone can read sessions"
  on public.game_sessions for select
  using (true);

create policy "Anyone can insert sessions"
  on public.game_sessions for insert
  with check (true);

create policy "Anyone can update sessions"
  on public.game_sessions for update
  using (true)
  with check (true);

create policy "Anyone can delete sessions"
  on public.game_sessions for delete
  using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'game_sessions'
  ) then
    execute 'alter publication supabase_realtime add table public.game_sessions';
  end if;
end $$;
