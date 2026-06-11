'use client';

import { useState } from 'react';
import { ADMIN_PASSWORD, unlockAdmin } from '../../lib/session';

export default function AdminLogin({ onUnlocked }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  function submit(e) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      unlockAdmin();
      onUnlocked();
    } else {
      setErr('Wrong admin password.');
    }
  }

  return (
    <div className="gate">
      <h1>🔧 Admin</h1>
      <form onSubmit={submit} className="card">
        <input type="password" placeholder="Admin password" value={pw}
          onChange={(e) => setPw(e.target.value)} autoFocus />
        <button type="submit">Unlock</button>
        {err && <p className="error">{err}</p>}
      </form>
    </div>
  );
}
