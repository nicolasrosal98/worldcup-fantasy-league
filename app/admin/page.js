import { getDb } from '../../lib/db';
import { isAdmin } from '../../lib/auth';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';

export const dynamic = 'force-dynamic';

export default function Admin() {
  if (!isAdmin()) return <AdminLogin />;
  const matches = getDb().prepare('SELECT * FROM matches ORDER BY kickoff').all();
  return <AdminPanel matches={matches} />;
}
