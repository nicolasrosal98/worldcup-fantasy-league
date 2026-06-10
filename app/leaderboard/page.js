import { redirect } from 'next/navigation';
import { getDb } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { WINNER_PICK_POINTS } from '../../lib/scoring';
import Nav from '../Nav';

export const dynamic = 'force-dynamic';

export default function Leaderboard() {
  const user = getSessionUser();
  if (!user) redirect('/');

  const db = getDb();
  const rows = db.prepare(`
    SELECT u.id, u.username, u.avatar, u.winner_pick,
      COALESCE(SUM(p.points), 0) AS match_points,
      COUNT(p.id) AS predictions,
      SUM(CASE WHEN p.points >= 5 THEN 1 ELSE 0 END) AS exacts
    FROM users u
    LEFT JOIN predictions p ON p.user_id = u.id AND p.points IS NOT NULL
    GROUP BY u.id
  `).all();

  // Winner pick bonus once the champion is recorded (admin enters the final's
  // result; champion = winner of the latest 'Final' stage match)
  const final = db.prepare(
    `SELECT * FROM matches WHERE stage = 'Final' AND home_score IS NOT NULL ORDER BY kickoff DESC LIMIT 1`
  ).get();
  const champion = final
    ? (final.home_score > final.away_score ? final.home : final.away)
    : null;

  for (const r of rows) {
    r.bonus = champion && r.winner_pick === champion ? WINNER_PICK_POINTS : 0;
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
          first-goal bet +2/−1 · daily boost ×2 · champion pick +{WINNER_PICK_POINTS}
        </p>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Player</th><th>Winner pick</th>
                <th>Preds</th><th>Exacts</th><th>Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={r.id === user.id ? 'me' : ''}>
                  <td>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                  <td>{r.avatar} {r.username}</td>
                  <td className="muted">{r.winner_pick || '—'}</td>
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
