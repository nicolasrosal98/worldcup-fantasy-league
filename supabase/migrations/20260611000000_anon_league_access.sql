-- The app now talks to Supabase from the browser with the publishable (anon)
-- key via supabase-js. The league is a private, password-gated game between
-- friends, so the anon role gets read/write access to the league tables.
-- No delete policies — the app never deletes rows.

create policy "anon read users" on public.users
  for select to anon using (true);
create policy "anon insert users" on public.users
  for insert to anon with check (true);
create policy "anon update users" on public.users
  for update to anon using (true) with check (true);

create policy "anon read matches" on public.matches
  for select to anon using (true);
create policy "anon insert matches" on public.matches
  for insert to anon with check (true);
create policy "anon update matches" on public.matches
  for update to anon using (true) with check (true);

create policy "anon read predictions" on public.predictions
  for select to anon using (true);
create policy "anon insert predictions" on public.predictions
  for insert to anon with check (true);
create policy "anon update predictions" on public.predictions
  for update to anon using (true) with check (true);
