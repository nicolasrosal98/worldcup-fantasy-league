import { NextResponse } from 'next/server';
import { getSql } from '../../../../lib/db';
import { isAdmin } from '../../../../lib/auth';
import { scoreMatchPrediction } from '../../../../lib/scoring';

export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { match_id, home_score, away_score, scorers, first_goal_half, info,
    red_card, penalty, hat_trick } = await req.json();
  if (!Number.isInteger(home_score) || !Number.isInteger(away_score)) {
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
  }

  const sql = getSql();
  const [match] = await sql`SELECT * FROM matches WHERE id = ${Number(match_id) || 0}`;
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  const preds = await sql`SELECT * FROM predictions WHERE match_id = ${match.id}`;

  // League majority outcome ('H'/'D'/'A') for the "against the crowd" bonus:
  // only set with 3+ predictions and a clear (untied) majority
  let crowd = null;
  if (preds.length >= 3) {
    const counts = { H: 0, D: 0, A: 0 };
    for (const p of preds) {
      const s = Math.sign(p.home_score - p.away_score);
      counts[s > 0 ? 'H' : s < 0 ? 'A' : 'D']++;
    }
    const top = Math.max(counts.H, counts.D, counts.A);
    const leaders = Object.keys(counts).filter((k) => counts[k] === top);
    if (leaders.length === 1) crowd = leaders[0];
  }

  const notes = JSON.stringify({
    first_goal_half: first_goal_half || null,
    info: info || '',
    red_card: !!red_card,
    penalty: !!penalty,
    hat_trick: !!hat_trick,
    crowd_outcome: crowd,
  });
  const scorersJson = JSON.stringify(Array.isArray(scorers) ? scorers : []);

  await sql`
    UPDATE matches SET home_score = ${home_score}, away_score = ${away_score},
      scorers = ${scorersJson}, notes = ${notes} WHERE id = ${match.id}
  `;

  const [updated] = await sql`SELECT * FROM matches WHERE id = ${match.id}`;
  for (const p of preds) {
    await sql`UPDATE predictions SET points = ${scoreMatchPrediction(p, updated)} WHERE id = ${p.id}`;
  }

  return NextResponse.json({ ok: true, rescored: preds.length });
}
