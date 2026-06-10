import { NextResponse } from 'next/server';
import { getSql } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const sql = getSql();
  const [{ k: first }] = await sql`SELECT MIN(kickoff) AS k FROM matches`;
  if (first && new Date(first) <= new Date()) {
    return NextResponse.json({ error: 'Winner picks are locked' }, { status: 400 });
  }

  const { team } = await req.json();
  if (!team || typeof team !== 'string') {
    return NextResponse.json({ error: 'Invalid team' }, { status: 400 });
  }
  await sql`UPDATE users SET winner_pick = ${team.slice(0, 40)} WHERE id = ${user.id}`;
  return NextResponse.json({ ok: true });
}
