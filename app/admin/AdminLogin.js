'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) router.refresh();
    else setErr('Wrong admin password.');
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
