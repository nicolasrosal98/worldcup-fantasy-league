-- Email OTP auth: profiles are now linked to Supabase Auth users, and the
-- blanket anon policies are replaced with authenticated-only policies.
-- Players sign in with a 6-digit email code (signInWithOtp + verifyOtp).

alter table public.users
  add column auth_id uuid unique references auth.users(id) on delete cascade;

drop policy "anon read users" on public.users;
drop policy "anon insert users" on public.users;
drop policy "anon update users" on public.users;
drop policy "anon read matches" on public.matches;
drop policy "anon insert matches" on public.matches;
drop policy "anon update matches" on public.matches;
drop policy "anon read predictions" on public.predictions;
drop policy "anon insert predictions" on public.predictions;
drop policy "anon update predictions" on public.predictions;

-- Everyone in the league can see all profiles (leaderboard), but can only
-- create and edit their own.
create policy "league read users" on public.users
  for select to authenticated using (true);
create policy "league insert own profile" on public.users
  for insert to authenticated with check (auth_id = (select auth.uid()));
create policy "league update own profile" on public.users
  for update to authenticated
  using (auth_id = (select auth.uid()))
  with check (auth_id = (select auth.uid()));

-- Matches are writable by any league member: the admin panel runs in the
-- browser as a normal signed-in user (gated by the admin password in the UI).
create policy "league read matches" on public.matches
  for select to authenticated using (true);
create policy "league insert matches" on public.matches
  for insert to authenticated with check (true);
create policy "league update matches" on public.matches
  for update to authenticated using (true) with check (true);

-- Predictions: read all (leaderboard), insert only your own. Updates stay
-- open to any member because entering a result regrades everyone's points
-- from the admin panel.
create policy "league read predictions" on public.predictions
  for select to authenticated using (true);
create policy "league insert own predictions" on public.predictions
  for insert to authenticated with check (
    exists (
      select 1 from public.users u
      where u.id = user_id and u.auth_id = (select auth.uid())
    )
  );
create policy "league update predictions" on public.predictions
  for update to authenticated using (true) with check (true);
