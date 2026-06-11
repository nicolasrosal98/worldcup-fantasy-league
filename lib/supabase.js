import { createClient } from '@supabase/supabase-js';

let client;

// Browser Supabase client using the publishable (anon) key. Players sign in
// with an email OTP code; supabase-js persists the session in localStorage.
// RLS policies only open the league tables to authenticated users.
export function getSupabase() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Supabase dashboard → Settings → API).'
    );
  }
  client = createClient(url, key);
  return client;
}

// The signed-in player's profile row, or null when signed out. `profile` is
// null (with a session) until the first-login name/avatar step is done.
export async function getSessionProfile() {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { session: null, profile: null };
  const { data: profile, error } = await supabase
    .from('users').select('*').eq('auth_id', session.user.id).maybeSingle();
  if (error) throw error;
  return { session, profile };
}
