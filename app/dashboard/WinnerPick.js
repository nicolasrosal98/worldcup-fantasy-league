'use client';

import { useState } from 'react';
import { getSupabase } from '../../lib/supabase';

export default function WinnerPick({ userId, teams, current, currentTopScorer, locked, onSaved }) {
  const [pick, setPick] = useState(current || '');
  const [topScorer, setTopScorer] = useState(currentTopScorer || '');
  const [msg, setMsg] = useState('');

  async function save() {
    const updates = {
      ...(pick ? { winner_pick: pick.slice(0, 40) } : {}),
      ...(topScorer.trim() ? { top_scorer_pick: topScorer.trim().slice(0, 40) } : {}),
    };
    const { error } = await getSupabase().from('users').update(updates).eq('id', userId);
    setMsg(!error ? 'Picks saved ✔' : 'Could not save picks.');
    onSaved?.();
  }

  return (
    <div className="card">
      <h2>🏆 Champion pick (25 pts) &amp; 👟 Golden Boot (15 pts)</h2>
      {locked ? (
        <p className="muted">
          Picks are locked. Champion: <strong>{current || 'none 😬'}</strong> ·
          Golden Boot: <strong>{currentTopScorer || 'none 😬'}</strong>
        </p>
      ) : (
        <>
          <p className="muted">
            You can change both until the first knockout match kicks off —
            watch the group stage, then commit.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">Pick a champion…</option>
              {teams.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder="Top scorer, e.g. Mbappé" value={topScorer}
              onChange={(e) => setTopScorer(e.target.value)} />
            <button onClick={save} disabled={!pick && !topScorer.trim()}>Save</button>
            {msg && <span className="success">{msg}</span>}
          </div>
        </>
      )}
    </div>
  );
}
