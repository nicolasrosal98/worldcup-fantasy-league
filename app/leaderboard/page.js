'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase, getSessionProfile } from '../../lib/supabase';
import { WINNER_PICK_POINTS, TOP_SCORER_POINTS, computeTopScorers } from '../../lib/scoring';
import { computeDailyBonuses, PERFECT_DAY_POINTS, DUEL_WIN_POINTS } from '../../lib/bonus';
import Nav from '../Nav';

export default function Leaderboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { profile } = await getSessionProfile();
        if (!profile) {
          router.replace('/');
          return;
        }
        const supabase = getSupabase();
        const [users, matches, preds] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('matches').select('*'),
          supabase.from('predictions').select('*'),
        ]);
        const err = users.error || matches.error || preds.error;
        if (err) throw err;
        setData({ user: profile, users: users.data, matches: matches.data, preds: preds.data });
      } catch (err) {
        setError(err.message || 'Could not load the leaderboard.');
      }
    })();
  }, [router]);

  if (error) {
    return (
      <div className="container">
        <p className="error">{error}</p>
      </div>
    );
  }
  if (!data) return <div className="container"><p className="muted">Loading…</p></div>;

  const { user, users, matches, preds } = data;

  const rows = users.map((u) => {
    const graded = preds.filter((p) => p.user_id === u.id && p.points !== null);
    return {
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      winner_pick: u.winner_pick,
      top_scorer_pick: u.top_scorer_pick,
      match_points: graded.reduce((s, p) => s + p.points, 0),
      predictions: graded.length,
      exacts: graded.filter((p) => p.points >= 5).length,
    };
  });

  // Winner pick bonus once the champion is recorded (admin enters the final's
  // result; champion = winner of the latest 'Final' stage match)
  const final = matches
    .filter((m) => m.stage === 'Final' && m.home_score !== null)
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff))[0];
  const champion = final
    ? (final.home_score > final.away_score ? final.home : final.away)
    : null;

  // Golden Boot pays out once the tournament is over (ties all count)
  const topScorers = champion ? computeTopScorers(matches) : new Set();

  // Perfect-day and daily-duel bonuses, settled per finished matchday
  const daily = computeDailyBonuses(rows.map((r) => r.id), matches, preds);

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
