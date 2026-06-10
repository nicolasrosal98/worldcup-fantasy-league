import { redirect } from 'next/navigation';
import { getSql } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { duelPairs, DUEL_WIN_POINTS } from '../../lib/bonus';
import Nav from '../Nav';
import MatchCard from './MatchCard';
import WinnerPick from './WinnerPick';

export const dynamic = 'force-dynamic';

async function computeStreak(sql, userId) {
  const days = (
    await sql`
      SELECT DISTINCT left(updated_at, 10) AS d FROM predictions
      WHERE user_id = ${userId} ORDER BY d DESC
    `
  ).map((r) => r.d);
  let streak = 0;
  const today = new Date();
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    if (days.includes(iso)) streak++;
    else if (i === 0) continue; // today not yet predicted doesn't break streak
    else break;
  }
  return streak;
}

export default async function Dashboard() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const sql = getSql();
  const matches = await sql`SELECT * FROM matches ORDER BY kickoff`;
  const preds = await sql`SELECT * FROM predictions WHERE user_id = ${user.id}`;
  const predByMatch = Object.fromEntries(preds.map((p) => [p.match_id, p]));

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const upcoming = matches.filter((m) => m.home_score === null && new Date(m.kickoff) > now);
  const finished = matches.filter((m) => m.home_score !== null).reverse();
  const todays = upcoming.filter((m) => m.kickoff.slice(0, 10) === todayIso);
  const missingToday = todays.filter((m) => !predByMatch[m.id]);

  const boostUsedToday = preds.some(
    (p) => p.boost && p.updated_at.slice(0, 10) === todayIso &&
      matches.find((m) => m.id === p.match_id)?.home_score === null
  );

  const streak = await computeStreak(sql, user.id);
  // Champion/Golden Boot picks lock when the knockout rounds begin
  const knockoutStart = matches
    .filter((m) => !m.stage.startsWith('Group'))
    .map((m) => m.kickoff)
    .sort()[0];
  const picksLocked = !!knockoutStart && new Date(knockoutStart) <= now;
  const teams = [...new Set(matches.flatMap((m) => [m.home, m.away]))].sort();

  // Today's duel opponent (only on days that have matches)
  let duelOpponent = null;
  if (matches.some((m) => m.kickoff.slice(0, 10) === todayIso)) {
    const players = await sql`SELECT id, username, avatar FROM users`;
    const opponentId = duelPairs(players.map((p) => p.id), todayIso).get(user.id);
    duelOpponent = players.find((p) => p.id === opponentId) || null;
  }

  return (
    <>
      <Nav user={user} />
      <div className="container">
        {missingToday.length > 0 ? (
          <div className="nudge">
            <span style={{ fontSize: '1.5rem' }}>⏰</span>
            <div>
              <strong>
                {missingToday.length} match{missingToday.length > 1 ? 'es' : ''} today still
                need your prediction!
              </strong>
              <div className="muted">
                Lock in scores, scorers and your daily boost before kickoff.
                {streak > 1 && ` Don't break your ${streak}-day streak 🔥`}
              </div>
            </div>
          </div>
        ) : (
          streak > 0 && (
            <div className="nudge">
              <span style={{ fontSize: '1.5rem' }}>🔥</span>
              <strong>{streak}-day prediction streak — keep it going!</strong>
            </div>
          )
        )}

        {duelOpponent && (
          <div className="nudge">
            <span style={{ fontSize: '1.5rem' }}>⚔️</span>
            <div>
              <strong>
                Today&apos;s duel: you vs {duelOpponent.avatar} {duelOpponent.username}
              </strong>
              <div className="muted">
                Most points from today&apos;s matches wins +{DUEL_WIN_POINTS}. No mercy.
              </div>
            </div>
          </div>
        )}

        <WinnerPick
          teams={teams}
          current={user.winner_pick}
          currentTopScorer={user.top_scorer_pick}
          locked={picksLocked}
        />

        <h2>Upcoming matches</h2>
        {upcoming.length === 0 && <p className="muted">No upcoming fixtures yet.</p>}
        {upcoming.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            prediction={predByMatch[m.id] || null}
            boostUsedToday={boostUsedToday}
          />
        ))}

        <h2>Results</h2>
        {finished.length === 0 && (
          <p className="muted">No results yet — points will appear here after each match.</p>
        )}
        {finished.map((m) => (
          <MatchCard key={m.id} match={m} prediction={predByMatch[m.id] || null} finished />
        ))}
      </div>
    </>
  );
}
