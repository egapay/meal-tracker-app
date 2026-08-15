-- Protein Tracker schema.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to read top to bottom; it creates two tables, locks both down with Row
-- Level Security, and adds a trigger that gives each new account a profile row.

-- Daily protein goal. Exactly one row per user, keyed by the auth user id.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  daily_protein_goal smallint not null default 150
    check (daily_protein_goal between 1 and 1000),
  created_at timestamptz not null default now()
);

-- One row per food logged.
create table public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- The calendar date as the user experienced it, supplied by the device.
  -- Deriving this from created_at instead would push an 11pm snack onto the
  -- next day for anyone east of UTC, and would make back-filling a forgotten
  -- meal impossible.
  entry_date date not null,

  meal_type text not null
    check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),

  name text not null check (char_length(trim(name)) between 1 and 80),

  -- numeric, not integer: real foods are 12.5g. One decimal is plenty, and
  -- numeric avoids the rounding drift a float would accumulate in daily sums.
  protein_grams numeric(5, 1) not null
    check (protein_grams >= 0 and protein_grams <= 1000),

  created_at timestamptz not null default now()
);

-- Both screens ask the same question: this user's rows, newest day first.
create index food_entries_user_date_idx
  on public.food_entries (user_id, entry_date desc, created_at);

-- Row Level Security ---------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.food_entries enable row level security;

-- Notes on the two policies below:
--   * `to authenticated` means an anonymous request matches no policy at all,
--     so a leaked anon key on its own reads nothing.
--   * `using` filters rows on read/update/delete; `with check` is the half that
--     stops a client from writing a row under someone else's id. Both are
--     needed -- `using` alone would leave inserts unconstrained.
--   * auth.uid() is wrapped in a subselect so Postgres evaluates it once per
--     statement rather than once per row.

create policy "Users read and write only their own profile"
  on public.profiles
  for all
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users read and write only their own entries"
  on public.food_entries
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Profile bootstrap ----------------------------------------------------------

-- Creating the profile row here rather than in the client means the row is
-- guaranteed to exist before the app ever loads, and the default goal lives in
-- exactly one place (the column default above).
--
-- security definer is required to write to public.profiles from a trigger on
-- auth.users; the empty search_path is why every name below is fully qualified.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
