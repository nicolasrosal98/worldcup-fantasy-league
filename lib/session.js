// Client-side session: the logged-in profile lives in localStorage. There are
// no real accounts — the shared league password is the only gate.

export const LEAGUE_PASSWORD =
  process.env.NEXT_PUBLIC_LEAGUE_PASSWORD || 'laslo2026!&';
export const ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'laslo2026!&admin';

const USER_KEY = 'laslo-league-user';
const ADMIN_KEY = 'laslo-league-admin';

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function storeUser(user) {
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ id: user.id, username: user.username, avatar: user.avatar })
  );
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

export function isAdminUnlocked() {
  return typeof window !== 'undefined' && localStorage.getItem(ADMIN_KEY) === '1';
}

export function unlockAdmin() {
  localStorage.setItem(ADMIN_KEY, '1');
}
