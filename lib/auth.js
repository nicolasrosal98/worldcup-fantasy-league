import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getDb } from './db';

export const LEAGUE_PASSWORD = process.env.LEAGUE_PASSWORD || 'laslo2026!&';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'laslo2026!&admin';
const SECRET = process.env.SESSION_SECRET || 'laslo-league-secret-2026';

function sign(value) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

export function makeSessionToken(userId) {
  const payload = String(userId);
  return `${payload}.${sign(payload)}`;
}

export function getSessionUser() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || sig !== sign(payload)) return null;
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(Number(payload)) || null;
}

export function isAdmin() {
  const token = cookies().get('admin')?.value;
  return token === sign('admin');
}

export function makeAdminToken() {
  return sign('admin');
}
