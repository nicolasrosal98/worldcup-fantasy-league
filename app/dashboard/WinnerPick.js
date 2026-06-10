'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WinnerPick({ teams, current, locked }) {
  const router = useRouter();
  const [pick, setPick] = useState(current || '');
  const [msg, setMsg] = useState('');

  async function save() {
    const res = await fetch('/api/winner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team: pick }),
    });
    setMsg(res.ok ? 'Winner pick saved ✔' : 'Could not save (picks lock at kickoff).');
    router.refresh();
  }

  return (
    <div className="card">
      <h2>🏆 Overall winner pick — 25 pts</h2>
      {locked ? (
        <p className="muted">
          Picks are locked. Yours: <strong>{current || 'none 😬'}</strong>
        </p>
      ) : (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Pick a team…</option>
            {teams.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={save} disabled={!pick}>Save</button>
          {msg && <span className="success">{msg}</span>}
        </div>
      )}
    </div>
  );
}
