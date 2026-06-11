'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '../lib/supabase';
import { LEAGUE_PASSWORD } from '../lib/session';

const AVATARS = ['⚽', '🏆', '🦁', '🦅', '🐺', '🔥', '🌟', '🐉', '🦈', '🎯', '👑', '🚀'];

export default function LoginGate({ initialStep = 'password' }) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('⚽');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  function checkPassword(e) {
    e.preventDefault();
    setError('');
    if (password === LEAGUE_PASSWORD) setStep('email');
    else setError('Wrong password — ask the league admin.');
  }

  async function sendCode(e) {
    e?.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    const { error: err } = await getSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (err) {
      setError(err.message || 'Could not send the code.');
    } else {
      setStep('code');
      setNotice(`We emailed a 6-digit code to ${email.trim()}.`);
    }
  }

  async function verifyCode(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const supabase = getSupabase();
    const { data, error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    if (err) {
      setBusy(false);
      setError('Wrong or expired code — try again or resend.');
      return;
    }
    // Returning player goes straight in; first-timers pick a profile
    const { data: profile } = await supabase
      .from('users').select('id').eq('auth_id', data.user.id).maybeSingle();
    setBusy(false);
    if (profile) router.push('/dashboard');
    else setStep('profile');
  }

  async function createProfile(e) {
    e.preventDefault();
    setError('');
    const name = username.trim();
    if (name.length < 2 || name.length > 24) {
      setError('Name must be 2–24 characters');
      return;
    }
    setBusy(true);
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setStep('email');
      setError('Your session expired — sign in again.');
      return;
    }
    const { error: err } = await supabase
      .from('users')
      .insert({ username: name, avatar: avatar || '⚽', auth_id: user.id });
    setBusy(false);
    if (err) {
      setError(err.code === '23505' ? 'That name is taken — pick another.' : err.message);
      return;
    }
    router.push('/dashboard');
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

      {step === 'email' && (
        <form onSubmit={sendCode} className="card">
          <h2>Sign in with your email</h2>
          <p className="muted">
            We&apos;ll email you a 6-digit code — no password to remember.
            New emails create an account automatically.
          </p>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <button type="submit" disabled={busy || !email.trim()}>Send code</button>
          {error && <p className="error">{error}</p>}
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={verifyCode} className="card">
          <h2>Enter the code</h2>
          {notice && <p className="muted">{notice}</p>}
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            autoFocus
          />
          <button type="submit" disabled={busy || code.trim().length < 6}>Verify</button>
          <button type="button" className="secondary" disabled={busy} onClick={sendCode}>
            Resend code
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}

      {step === 'profile' && (
        <form onSubmit={createProfile} className="card">
          <h2>Your profile</h2>
          <p className="muted">First time here — pick a name and avatar.</p>
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
