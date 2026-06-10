import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';

export async function POST(req) {
  const user = getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const db = getDb();
  const first = db.prepare('SELECT MIN(kickoff) AS k FROM matches').get().k;
  if (first && new Date(first) <= new Date()) {
    return NextResponse.json({ error: 'Winner picks are locked' }, { status: 400 });
  }

  const { team } = await req.json();
  if (!team || typeof team !== 'string') {
    return NextResponse.json({ error: 'Invalid team' }, { status: 400 });
  }
  db.prepare('UPDATE users SET winner_pick = ? WHERE id = ?').run(team.slice(0, 40), user.id);
  return NextResponse.json({ ok: true });
}
