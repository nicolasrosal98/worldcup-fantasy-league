import { createClient } from '@supabase/supabase-js';

let client;

// Browser Supabase client using the publishable (anon) key. RLS policies on
// users/matches/predictions allow the anon role to read and write — the
// league itself is gated by the shared password in the UI.
export function getSupabase() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Supabase dashboard → Settings → API).'
    );
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
