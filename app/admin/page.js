'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { isAdminUnlocked } from '../../lib/session';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';

export default function Admin() {
  // 'loading' | 'no-session' | 'login' | 'panel'
  const [state, setState] = useState('loading');

  useEffect(() => {
    (async () => {
      // Admin writes go through RLS as a normal signed-in league member,
      // so the admin must be logged into the league first.
      const { data: { session } } = await getSupabase().auth.getSession();
      if (!session) setState('no-session');
      else setState(isAdminUnlocked() ? 'panel' : 'login');
    })();
  }, []);

  if (state === 'loading') return null;
  if (state === 'no-session') {
    return (
      <div className="gate">
        <h1>🔧 Admin</h1>
        <p className="muted">
          Sign in to the league first, then come back here. <a href="/">Go to login →</a>
        </p>
      </div>
    );
  }
  if (state === 'login') return <AdminLogin onUnlocked={() => setState('panel')} />;
  return <AdminPanel />;
}
