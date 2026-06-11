// Shared league secrets, checked client-side. Identity itself comes from
// Supabase Auth (email OTP) — these passwords just gate entry to the league
// and the admin panel.

export const LEAGUE_PASSWORD =
  process.env.NEXT_PUBLIC_LEAGUE_PASSWORD || 'laslo2026!&';
export const ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'laslo2026!&admin';

const ADMIN_KEY = 'laslo-league-admin';

export function isAdminUnlocked() {
  return typeof window !== 'undefined' && localStorage.getItem(ADMIN_KEY) === '1';
}

export function unlockAdmin() {
  localStorage.setItem(ADMIN_KEY, '1');
}
