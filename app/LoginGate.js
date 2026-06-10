'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const AVATARS = ['⚽', '🏆', '🦁', '🦅', '🐺', '🔥', '🌟', '🐉', '🦈', '🎯', '👑', '🚀'];

export default function LoginGate() {
  const router = useRouter();
  const [step, setStep] = useState('password');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('⚽');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function checkPassword(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setStep('profile');
    else setError('Wrong password — ask the league admin.');
  }

  async function enter(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, username, avatar }),
    });
    setBusy(false);
    if (res.ok) router.push('/dashboard');
    else setError((await res.json()).error || 'Something went wrong.');
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
