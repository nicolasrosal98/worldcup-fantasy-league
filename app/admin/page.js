import { getSql } from '../../lib/db';
import { isAdmin } from '../../lib/auth';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';

export const dynamic = 'force-dynamic';

export default async function Admin() {
  if (!isAdmin()) return <AdminLogin />;
  const matches = await getSql()`SELECT * FROM matches ORDER BY kickoff`;
  return <AdminPanel matches={matches} />;
}
