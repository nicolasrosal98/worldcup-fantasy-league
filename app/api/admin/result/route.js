import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { isAdmin } from '../../../../lib/auth';
import { scoreMatchPrediction } from '../../../../lib/scoring';

export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { match_id, home_score, away_score, scorers, first_goal_half, info } = await req.json();
  if (!Number.isInteger(home_score) || !Number.isInteger(away_score)) {
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
  }

  const db = getDb();
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(match_id);
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  const notes = JSON.stringify({ first_goal_half: first_goal_half || null, info: info || '' });
  const scorersJson = JSON.stringify(Array.isArray(scorers) ? scorers : []);

  db.prepare(
    'UPDATE matches SET home_score = ?, away_score = ?, scorers = ?, notes = ? WHERE id = ?'
  ).run(home_score, away_score, scorersJson, notes, match_id);

  const updated = db.prepare('SELECT * FROM matches WHERE id = ?').get(match_id);
  const preds = db.prepare('SELECT * FROM predictions WHERE match_id = ?').all(match_id);
  const setPts = db.prepare('UPDATE predictions SET points = ? WHERE id = ?');
  for (const p of preds) {
    setPts.run(scoreMatchPrediction(p, updated), p.id);
  }

  return NextResponse.json({ ok: true, rescored: preds.length });
}
