-- Profiles table for username-based login mapping
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  email text,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Optional: case-insensitive uniqueness on username
create unique index if not exists profiles_username_lower_key on public.profiles ((lower(username))) where username is not null;

-- RLS: allow public read (needed for resolving username -> email before login)
alter table public.profiles enable row level security;
drop policy if exists "Public read profiles" on public.profiles;
create policy "Public read profiles" on public.profiles for select using (true);

-- RLS: authenticated users can insert/update their own row
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update
  to authenticated
  using (auth.uid() = id);

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

-- Trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create profile on new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_full_name text;
  v_username text;
begin
  begin
    v_full_name := coalesce(new.raw_user_meta_data->>'full_name','');
    v_username := coalesce(new.raw_user_meta_data->>'username','');
  exception when others then
    v_full_name := '';
    v_username := '';
  end;
  insert into public.profiles (id, email, full_name, username)
  values (new.id, new.email, nullif(v_full_name,''), nullif(lower(v_username),''))
  on conflict (id) do nothing;
  return new;
end
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
