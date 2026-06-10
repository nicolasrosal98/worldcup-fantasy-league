import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';

export async function POST(req) {
  const user = getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const body = await req.json();
  const { match_id, home_score, away_score, scorers, first_goal_half, boost } = body;

  const db = getDb();
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(match_id);
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (new Date(match.kickoff) <= new Date() || match.home_score !== null) {
    return NextResponse.json({ error: 'Predictions are locked for this match' }, { status: 400 });
  }
  if (
    !Number.isInteger(home_score) || !Number.isInteger(away_score) ||
    home_score < 0 || away_score < 0 || home_score > 15 || away_score > 15
  ) {
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
  }

  const scorersJson = JSON.stringify(
    (Array.isArray(scorers) ? scorers : []).map((s) => String(s).slice(0, 40)).slice(0, 3)
  );
  const half = first_goal_half === 1 || first_goal_half === 2 ? first_goal_half : null;

  // One boost per day across not-yet-played matches
  if (boost) {
    const today = new Date().toISOString().slice(0, 10);
    const other = db.prepare(`
      SELECT COUNT(*) AS c FROM predictions p
      JOIN matches m ON m.id = p.match_id
      WHERE p.user_id = ? AND p.boost = 1 AND p.match_id != ?
        AND date(p.updated_at) = ? AND m.home_score IS NULL
    `).get(user.id, match_id, today).c;
    if (other > 0) {
      return NextResponse.json({ error: 'You already used your boost today' }, { status: 400 });
    }
  }

  db.prepare(`
    INSERT INTO predictions (user_id, match_id, home_score, away_score, scorers, first_goal_half, boost, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, match_id) DO UPDATE SET
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      scorers = excluded.scorers,
      first_goal_half = excluded.first_goal_half,
      boost = excluded.boost,
      updated_at = datetime('now')
  `).run(user.id, match_id, home_score, away_score, scorersJson, half, boost ? 1 : 0);

  return NextResponse.json({ ok: true });
}
