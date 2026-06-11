'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '../lib/supabase';
import { LEAGUE_PASSWORD, storeUser } from '../lib/session';

const AVATARS = ['⚽', '🏆', '🦁', '🦅', '🐺', '🔥', '🌟', '🐉', '🦈', '🎯', '👑', '🚀'];

export default function LoginGate() {
  const router = useRouter();
  const [step, setStep] = useState('password');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('⚽');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function checkPassword(e) {
    e.preventDefault();
    setError('');
    if (password === LEAGUE_PASSWORD) setStep('profile');
    else setError('Wrong password — ask the league admin.');
  }

  async function enter(e) {
    e.preventDefault();
    setError('');
    const name = username.trim();
    if (name.length < 2 || name.length > 24) {
      setError('Name must be 2–24 characters');
      return;
    }
    setBusy(true);
    try {
      const supabase = getSupabase();
      // Returning player: case-insensitive name match (ilike with escaped
      // wildcards = case-insensitive equality)
      let { data: user, error: err } = await supabase
        .from('users')
        .select('id, username, avatar')
        .ilike('username', name.replace(/[%_]/g, '\\$&'))
        .maybeSingle();
      if (err) throw err;
      if (!user) {
        ({ data: user, error: err } = await supabase
          .from('users')
          .insert({ username: name, avatar: avatar || '⚽' })
          .select('id, username, avatar')
          .single());
        if (err) throw err;
      }
      storeUser(user);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gate">
      <h1>🏆 Laslo League</h1>
      <p className="muted">World Cup 2026 — private fantasy league</p>

      {step === 'password' && (
        <form onSubmit={checkPassword} className="card">
          <h2>Enter the league password</h2>
          <input
            type="password"
            placeholder="League password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="submit">Unlock</button>
          {error && <p className="error">{error}</p>}
        </form>
      )}

      {step === 'profile' && (
        <form onSubmit={enter} className="card">
          <h2>Your profile</h2>
          <p className="muted">
            New here? Pick a name and avatar. Returning? Just type your existing name.
          </p>
          <input
            placeholder="Your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={24}
            autoFocus
          />
          <div className="avatar-pick">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                className={a === avatar ? 'sel' : ''}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>
          <button type="submit" disabled={busy || username.trim().length < 2}>
            Enter the league
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </div>
  );
}
