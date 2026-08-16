-- Water tracking. Run after schema.sql, once, in the SQL Editor.
--
-- Purely additive: it creates one table and adds one column. Nothing in
-- schema.sql is modified, so existing protein data is untouched.

alter table public.profiles
  add column daily_water_goal_oz smallint not null default 100
    check (daily_water_goal_oz between 1 and 500);

create table public.water_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Same reasoning as food_entries.entry_date: the local calendar day, supplied
  -- by the device, so a late-night glass lands on the day you experienced.
  entry_date date not null,

  -- Wall-clock time only. Paired with entry_date this is unambiguous local
  -- time; a timestamptz would need converting back for display and could shift
  -- the hour shown after a timezone change.
  drank_at time not null,

  amount_oz numeric(5, 1) not null check (amount_oz > 0 and amount_oz <= 500),

  created_at timestamptz not null default now()
);

-- Today reads one day; History reads a range. Both want chronological order
-- within a day, which for water is the time drunk rather than insertion order.
create index water_entries_user_date_idx
  on public.water_entries (user_id, entry_date desc, drank_at);

alter table public.water_entries enable row level security;

-- Identical in shape to the food_entries policy: `to authenticated` shuts out
-- anonymous requests entirely, `using` filters reads, `with check` stops a
-- client writing rows under another user's id.
create policy "Users read and write only their own water entries"
  on public.water_entries
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
