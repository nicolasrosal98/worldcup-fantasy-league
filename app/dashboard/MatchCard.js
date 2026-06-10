'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MatchCard({ match, prediction, finished = false, boostUsedToday = false }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [home, setHome] = useState(prediction?.home_score ?? '');
  const [away, setAway] = useState(prediction?.away_score ?? '');
  const [scorers, setScorers] = useState(
    prediction ? JSON.parse(prediction.scorers).join(', ') : ''
  );
  const [firstHalf, setFirstHalf] = useState(prediction?.first_goal_half ?? '');
  const [boost, setBoost] = useState(!!prediction?.boost);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const kickoff = new Date(match.kickoff);
  const locked = finished || kickoff <= new Date();
  const notes = safeParse(match.notes);

  async function save(e) {
    e.preventDefault();
    setErr(''); setMsg('');
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        match_id: match.id,
        home_score: Number(home),
        away_score: Number(away),
        scorers: scorers.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3),
        first_goal_half: firstHalf ? Number(firstHalf) : null,
        boost,
      }),
    });
    if (res.ok) {
      setMsg('Prediction saved ✔');
      router.refresh();
    } else {
      setErr((await res.json()).error || 'Could not save.');
    }
  }

  return (
    <div className="card">
      <div className="matchrow">
        <div>
          <span className="badge">{match.stage}</span>{' '}
          <span className="teams">
            {match.home}
            {finished ? ` ${match.home_score} – ${match.away_score} ` : ' vs '}
            {match.away}
          </span>
          <div className="muted">
            {kickoff.toLocaleString(undefined, {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
            {match.venue ? ` · ${match.venue}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {finished && (
            <>
              <span className="badge done">Full time</span>
              {prediction && (
                <div className="pts">
                  {prediction.points ?? 0} pts{prediction.boost ? ' ⚡' : ''}
                </div>
              )}
            </>
          )}
          {!finished && prediction && (
            <span className="badge done">
              Your pick: {prediction.home_score}–{prediction.away_score}
              {prediction.boost ? ' ⚡' : ''}
            </span>
          )}
          {!finished && !locked && (
            <div>
              <button className="secondary" onClick={() => setOpen(!open)} style={{ marginTop: 6 }}>
                {prediction ? 'Edit prediction' : 'Predict'}
              </button>
            </div>
          )}
          {!finished && locked && !prediction && <span className="badge live">Locked</span>}
        </div>
      </div>

      {finished && (notes?.scorers_text || match.scorers) && (
        <p className="muted" style={{ marginBottom: 0 }}>
          ⚽ Scorers: {JSON.parse(match.scorers || '[]').join(', ') || '—'}
          {notes?.info ? ` · ${notes.info}` : ''}
        </p>
      )}

      {open && !locked && (
        <form onSubmit={save} style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <strong>{match.home}</strong>
            <input className="score" type="number" min="0" max="15" required
              value={home} onChange={(e) => setHome(e.target.value)} />
            <span>–</span>
            <input className="score" type="number" min="0" max="15" required
              value={away} onChange={(e) => setAway(e.target.value)} />
            <strong>{match.away}</strong>
          </div>
          <label>
            <div className="muted">Scorers (up to 3, comma-separated) — +3 pts each, all-correct ×1.5 multiplier</div>
            <input style={{ width: '100%' }} placeholder="e.g. Mbappé, Bellingham"
              value={scorers} onChange={(e) => setScorers(e.target.value)} />
          </label>
          <label>
            <div className="muted">Bonus bet: first goal scored in… (+2 right / −1 wrong)</div>
            <select value={firstHalf} onChange={(e) => setFirstHalf(e.target.value)}>
              <option value="">No bet</option>
              <option value="1">1st half</option>
              <option value="2">2nd half</option>
            </select>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={boost}
              disabled={!boost && boostUsedToday}
              onChange={(e) => setBoost(e.target.checked)} />
            ⚡ Daily boost — double this match&apos;s points
            {!boost && boostUsedToday && <span className="muted">(already used today)</span>}
          </label>
          <div>
            <button type="submit">Save prediction</button>
            {msg && <span className="success" style={{ marginLeft: 10 }}>{msg}</span>}
            {err && <span className="error" style={{ marginLeft: 10 }}>{err}</span>}
          </div>
        </form>
      )}
    </div>
  );
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
