'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '../lib/session';
import LoginGate from './LoginGate';

export default function Home() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getStoredUser()) router.replace('/dashboard');
    else setChecked(true);
  }, [router]);

  if (!checked) return null;
  return <LoginGate />;
}
