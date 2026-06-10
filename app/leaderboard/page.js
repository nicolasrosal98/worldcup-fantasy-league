import { redirect } from 'next/navigation';
import { getSql } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { WINNER_PICK_POINTS, TOP_SCORER_POINTS, computeTopScorers } from '../../lib/scoring';
import { computeDailyBonuses, PERFECT_DAY_POINTS, DUEL_WIN_POINTS } from '../../lib/bonus';
import Nav from '../Nav';

export const dynamic = 'force-dynamic';

export default async function Leaderboard() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const sql = getSql();
  const rows = await sql`
    SELECT u.id, u.username, u.avatar, u.winner_pick, u.top_scorer_pick,
      COALESCE(SUM(p.points), 0)::int AS match_points,
      COUNT(p.id)::int AS predictions,
      COALESCE(SUM(CASE WHEN p.points >= 5 THEN 1 ELSE 0 END), 0)::int AS exacts
    FROM users u
    LEFT JOIN predictions p ON p.user_id = u.id AND p.points IS NOT NULL
    GROUP BY u.id
  `;

  // Winner pick bonus once the champion is recorded (admin enters the final's
  // result; champion = winner of the latest 'Final' stage match)
  const [final] = await sql`
    SELECT * FROM matches WHERE stage = 'Final' AND home_score IS NOT NULL
    ORDER BY kickoff DESC LIMIT 1
  `;
  const champion = final
    ? (final.home_score > final.away_score ? final.home : final.away)
    : null;

  // Golden Boot pays out once the tournament is over (ties all count)
  const topScorers = champion
    ? computeTopScorers(await sql`SELECT home_score, scorers FROM matches`)
    : new Set();

  // Perfect-day and daily-duel bonuses, settled per finished matchday
  const allMatches = await sql`SELECT id, kickoff, home_score, away_score FROM matches`;
  const allPreds = await sql`
    SELECT user_id, match_id, home_score, away_score, points FROM predictions
  `;
  const daily = computeDailyBonuses(rows.map((r) => r.id), allMatches, allPreds);

  for (const r of rows) {
    const d = daily.get(r.id) || { perfectDays: 0, duelWins: 0, bonus: 0 };
    r.perfectDays = d.perfectDays;
    r.duelWins = d.duelWins;
    r.bonus = d.bonus;
    if (champion && r.winner_pick === champion) r.bonus += WINNER_PICK_POINTS;
    if (r.top_scorer_pick && topScorers.has(r.top_scorer_pick.trim().toLowerCase())) {
      r.bonus += TOP_SCORER_POINTS;
    }
    r.total = r.match_points + r.bonus;
  }
  rows.sort((a, b) => b.total - a.total || b.exacts - a.exacts);

  return (
    <>
      <Nav user={user} />
      <div className="container">
        <h1>Leaderboard</h1>
        <p className="muted">
          Exact score 5 · outcome 2 · scorer +3 each · all scorers right ×1.5 ·
          first-goal bet +2/−1 · side bets 🎰 · against the crowd 🦄 +3 ·
          perfect day 🌟 +{PERFECT_DAY_POINTS} · duel win ⚔️ +{DUEL_WIN_POINTS} ·
          daily boost ×2 · champion pick +{WINNER_PICK_POINTS} ·
          Golden Boot +{TOP_SCORER_POINTS}
        </p>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Player</th><th>🏆 Pick</th><th>👟 Boot</th>
                <th>Preds</th><th>Exacts</th><th>🌟</th><th>⚔️</th><th>Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={r.id === user.id ? 'me' : ''}>
                  <td>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                  <td>{r.avatar} {r.username}</td>
                  <td className="muted">{r.winner_pick || '—'}</td>
                  <td className="muted">{r.top_scorer_pick || '—'}</td>
                  <td>{r.predictions}</td>
                  <td>{r.exacts}</td>
                  <td>{r.perfectDays || ''}</td>
                  <td>{r.duelWins || ''}</td>
                  <td className="pts">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
