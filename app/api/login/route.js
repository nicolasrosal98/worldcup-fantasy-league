import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { LEAGUE_PASSWORD, makeSessionToken } from '../../../lib/auth';

export async function POST(req) {
  const { password, username, avatar } = await req.json();

  if (password !== LEAGUE_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }
  // Password-only check (step 1 of the gate)
  if (!username) return NextResponse.json({ ok: true });

  const name = String(username).trim();
  if (name.length < 2 || name.length > 24) {
    return NextResponse.json({ error: 'Name must be 2–24 characters' }, { status: 400 });
  }

  const db = getDb();
  let user = db.prepare('SELECT * FROM users WHERE username = ?').get(name);
  if (!user) {
    const info = db
      .prepare('INSERT INTO users (username, avatar) VALUES (?, ?)')
      .run(name, avatar || '⚽');
    user = { id: info.lastInsertRowid };
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', makeSessionToken(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90,
    path: '/',
  });
  return res;
}
