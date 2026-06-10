import { NextResponse } from 'next/server';
import { getSql } from '../../../lib/db';
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

  const sql = getSql();
  let [user] = await sql`SELECT * FROM users WHERE lower(username) = lower(${name})`;
  if (!user) {
    [user] = await sql`
      INSERT INTO users (username, avatar) VALUES (${name}, ${avatar || '⚽'}) RETURNING id
    `;
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
