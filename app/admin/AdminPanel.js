'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { scoreMatchPrediction } from '../../lib/scoring';

export default function AdminPanel() {
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data, error: err } = await getSupabase()
      .from('matches').select('*').order('kickoff');
    if (err) setError(err.message);
    else setMatches(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!matches) return <div className="container"><p className="muted">Loading…</p></div>;

  return (
    <div className="container">
      <h1>🔧 Admin — match results</h1>
      <p className="muted">
        Enter the final score, scorers and first-goal half after each match.
        Saving recomputes everyone&apos;s points. <a href="/dashboard">← back to app</a>
      </p>
      <AddMatch onSaved={load} />
      {matches.map((m) => <ResultRow key={m.id} match={m} onSaved={load} />)}
    </div>
  );
}

// Saves a result and regrades every prediction for that match — the same
// logic the /api/admin/result route used to run on the server.
async function saveResult(match, { home_score, away_score, scorers, first_goal_half,
  red_card, penalty, hat_trick, info }) {
  const supabase = getSupabase();
  const { data: preds, error: predsErr } = await supabase
    .from('predictions').select('*').eq('match_id', match.id);
  if (predsErr) throw predsErr;

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

  const { error: matchErr } = await supabase.from('matches')
    .update({ home_score, away_score, scorers: scorersJson, notes })
    .eq('id', match.id);
  if (matchErr) throw matchErr;

  const updated = { ...match, home_score, away_score, scorers: scorersJson, notes };
  for (const p of preds) {
    const { error: err } = await supabase.from('predictions')
      .update({ points: scoreMatchPrediction(p, updated) })
      .eq('id', p.id);
    if (err) throw err;
  }
}

function ResultRow({ match, onSaved }) {
  const notes = safeParse(match.notes) || {};
  const [home, setHome] = useState(match.home_score ?? '');
  const [away, setAway] = useState(match.away_score ?? '');
  const [scorers, setScorers] = useState(JSON.parse(match.scorers || '[]').join(', '));
  const [half, setHalf] = useState(notes.first_goal_half ?? '');
  const [redCard, setRedCard] = useState(!!notes.red_card);
  const [penalty, setPenalty] = useState(!!notes.penalty);
  const [hatTrick, setHatTrick] = useState(!!notes.hat_trick);
  const [info, setInfo] = useState(notes.info || '');
  const [msg, setMsg] = useState('');

  async function save(e) {
    e.preventDefault();
    try {
      await saveResult(match, {
        home_score: Number(home),
        away_score: Number(away),
        scorers: scorers.split(',').map((s) => s.trim()).filter(Boolean),
        first_goal_half: half ? Number(half) : null,
        red_card: redCard,
        penalty,
        hat_trick: hatTrick,
        info,
      });
      setMsg('Saved & points recomputed ✔');
    } catch {
      setMsg('Error saving.');
    }
    onSaved();
  }

  return (
    <form onSubmit={save} className="card" style={{ display: 'grid', gap: 8 }}>
      <div className="matchrow">
        <strong>{match.home} vs {match.away}</strong>
        <span className="muted">{match.stage} · {new Date(match.kickoff).toLocaleString()}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="score" type="number" min="0" value={home}
          onChange={(e) => setHome(e.target.value)} placeholder="–" />
        <span>–</span>
        <input className="score" type="number" min="0" value={away}
          onChange={(e) => setAway(e.target.value)} placeholder="–" />
        <select value={half} onChange={(e) => setHalf(e.target.value)}>
          <option value="">First goal: n/a</option>
          <option value="1">First goal: 1st half</option>
          <option value="2">First goal: 2nd half</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={redCard} onChange={(e) => setRedCard(e.target.checked)} />
          🟥 Red card shown
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={penalty} onChange={(e) => setPenalty(e.target.checked)} />
          🎯 Penalty awarded
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={hatTrick} onChange={(e) => setHatTrick(e.target.checked)} />
          🎩 Hat-trick scored
        </label>
      </div>
      <input placeholder="Scorers, comma-separated" value={scorers}
        onChange={(e) => setScorers(e.target.value)} />
      <input placeholder="Match info / highlights (shown to players)" value={info}
        onChange={(e) => setInfo(e.target.value)} />
      <div>
        <button type="submit" disabled={home === '' || away === ''}>Save result</button>
        {msg && <span className="success" style={{ marginLeft: 10 }}>{msg}</span>}
      </div>
    </form>
  );
}

function AddMatch({ onSaved }) {
  const [stage, setStage] = useState('Round of 32');
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [kickoff, setKickoff] = useState('');
  const [venue, setVenue] = useState('');
  const [msg, setMsg] = useState('');

  async function save(e) {
    e.preventDefault();
    if (!home || !away || !kickoff || isNaN(new Date(kickoff))) {
      setMsg('Missing or invalid fields.');
      return;
    }
    const { error } = await getSupabase().from('matches').insert({
      stage, home, away, kickoff: new Date(kickoff).toISOString(), venue: venue || '',
    });
    setMsg(!error ? 'Match added ✔' : 'Error adding match.');
    if (!error) { setHome(''); setAway(''); setKickoff(''); setVenue(''); }
    onSaved();
  }

  return (
    <form onSubmit={save} className="card" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <strong style={{ width: '100%' }}>➕ Add fixture (knockouts, fixes)</strong>
      <select value={stage} onChange={(e) => setStage(e.target.value)}>
        {['Group A','Group B','Group C','Group D','Group E','Group F','Group G','Group H','Group I','Group J','Group K','Group L','Round of 32','Round of 16','Quarter-final','Semi-final','Third place','Final'].map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <input placeholder="Home team" value={home} onChange={(e) => setHome(e.target.value)} required />
      <input placeholder="Away team" value={away} onChange={(e) => setAway(e.target.value)} required />
      <input type="datetime-local" value={kickoff} onChange={(e) => setKickoff(e.target.value)} required />
      <input placeholder="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
      <button type="submit">Add</button>
      {msg && <span className="success">{msg}</span>}
    </form>
  );
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
