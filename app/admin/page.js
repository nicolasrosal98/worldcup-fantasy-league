'use client';

import { useEffect, useState } from 'react';
import { isAdminUnlocked } from '../../lib/session';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';

export default function Admin() {
  const [unlocked, setUnlocked] = useState(null);

  useEffect(() => {
    setUnlocked(isAdminUnlocked());
  }, []);

  if (unlocked === null) return null;
  if (!unlocked) return <AdminLogin onUnlocked={() => setUnlocked(true)} />;
  return <AdminPanel />;
}
