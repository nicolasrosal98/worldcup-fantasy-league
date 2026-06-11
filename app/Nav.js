'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '../lib/supabase';

export default function Nav({ user }) {
  const router = useRouter();
  async function logout() {
    await getSupabase().auth.signOut();
    router.push('/');
  }
  return (
    <nav className="nav">
      <Link href="/dashboard" className="brand">🏆 Laslo League</Link>
      <Link href="/dashboard">Matches</Link>
      <Link href="/leaderboard">Leaderboard</Link>
      <span className="spacer" />
      <span className="muted">{user.avatar} {user.username}</span>
      <button className="secondary" onClick={logout}>Log out</button>
    </nav>
  );
}
