import { NextResponse } from 'next/server';
import { getSql } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const sql = getSql();
  // Champion + Golden Boot picks stay open through the group stage and lock
  // when the first knockout match kicks off.
  const [{ k: knockoutStart }] = await sql`
    SELECT MIN(kickoff) AS k FROM matches WHERE stage NOT LIKE 'Group%'
  `;
  if (knockoutStart && new Date(knockoutStart) <= new Date()) {
    return NextResponse.json({ error: 'Picks locked — the knockouts have started' }, { status: 400 });
  }

  const { team, top_scorer } = await req.json();
  if (team !== undefined) {
    if (!team || typeof team !== 'string') {
      return NextResponse.json({ error: 'Invalid team' }, { status: 400 });
    }
    await sql`UPDATE users SET winner_pick = ${team.slice(0, 40)} WHERE id = ${user.id}`;
  }
  if (top_scorer !== undefined) {
    if (!top_scorer || typeof top_scorer !== 'string') {
      return NextResponse.json({ error: 'Invalid player' }, { status: 400 });
    }
    await sql`UPDATE users SET top_scorer_pick = ${top_scorer.trim().slice(0, 40)} WHERE id = ${user.id}`;
  }
  return NextResponse.json({ ok: true });
}
