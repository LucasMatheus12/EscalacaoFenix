create table if not exists public.game_sessions (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_type text not null check (game_type in ('quadra', 'campo')),
  players jsonb not null default '[]'::jsonb,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_type)
);

alter table public.game_sessions enable row level security;

drop policy if exists "Anyone can read sessions" on public.game_sessions;
drop policy if exists "Anyone can insert sessions" on public.game_sessions;
drop policy if exists "Anyone can update sessions" on public.game_sessions;
drop policy if exists "Anyone can delete sessions" on public.game_sessions;
drop policy if exists "Users read own sessions" on public.game_sessions;
drop policy if exists "Users insert own sessions" on public.game_sessions;
drop policy if exists "Users update own sessions" on public.game_sessions;
drop policy if exists "Users delete own sessions" on public.game_sessions;

create policy "Users read own sessions"
  on public.game_sessions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own sessions"
  on public.game_sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own sessions"
  on public.game_sessions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own sessions"
  on public.game_sessions for delete
  to authenticated
  using (auth.uid() = user_id);

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
