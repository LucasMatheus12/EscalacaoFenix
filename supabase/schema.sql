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

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_username text;
begin
  next_username := lower(trim(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))));
  next_username := regexp_replace(next_username, '[^a-z0-9._-]', '', 'g');
  if length(next_username) < 3 then
    next_username := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  if exists (
    select 1
    from public.profiles p
    where lower(p.username) = next_username
      and p.user_id <> new.id
  ) then
    next_username := left(next_username, 20) || substr(replace(new.id::text, '-', ''), 1, 4);
  end if;

  begin
    insert into public.profiles (user_id, username)
    values (new.id, next_username)
    on conflict (user_id) do nothing;
  exception
    when unique_violation then
      insert into public.profiles (user_id, username)
      values (new.id, 'user' || substr(replace(new.id::text, '-', ''), 1, 8))
      on conflict (user_id) do nothing;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_profile();

create or replace function public.login_email_for_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where lower(p.username) = lower(trim(p_username))
  limit 1;
$$;

create or replace function public.username_taken(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where lower(p.username) = lower(trim(p_username))
  );
$$;

grant execute on function public.login_email_for_username(text) to anon, authenticated;
grant execute on function public.username_taken(text) to anon, authenticated;
