'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionProfile } from '../lib/supabase';
import LoginGate from './LoginGate';

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { session, profile } = await getSessionProfile();
        if (profile) router.replace('/dashboard');
        else if (session) setStep('profile'); // signed in, no profile yet
        else setStep('password');
      } catch {
        setStep('password');
      }
    })();
  }, [router]);

  if (!step) return null;
  return <LoginGate initialStep={step} />;
}
