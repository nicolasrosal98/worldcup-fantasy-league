import { redirect } from 'next/navigation';
import { getSessionUser } from '../lib/auth';
import LoginGate from './LoginGate';

export default function Home() {
  if (getSessionUser()) redirect('/dashboard');
  return <LoginGate />;
}
