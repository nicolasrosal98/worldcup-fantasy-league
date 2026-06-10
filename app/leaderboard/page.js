import { redirect } from 'next/navigation';
import { getSql } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { WINNER_PICK_POINTS, TOP_SCORER_POINTS, computeTopScorers } from '../../lib/scoring';
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

  for (const r of rows) {
    r.bonus = champion && r.winner_pick === champion ? WINNER_PICK_POINTS : 0;
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
          first-goal bet +2/−1 · side bets 🎰 · daily boost ×2 ·
          champion pick +{WINNER_PICK_POINTS} · Golden Boot +{TOP_SCORER_POINTS}
        </p>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Player</th><th>🏆 Pick</th><th>👟 Boot</th>
                <th>Preds</th><th>Exacts</th><th>Points</th>
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
