import postgres from 'postgres';

let sql;

// Supabase Postgres. DATABASE_URL is the connection string from the Supabase
// dashboard (Connect → ORMs/Transaction pooler). The schema lives in Supabase
// migrations, so the app just connects — no init or seeding here.
export function getSql() {
  if (sql) return sql;
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Copy the connection string from the Supabase dashboard (project cxajvygxdeptdsdjomdr → Connect).'
    );
  }
  sql = postgres(process.env.DATABASE_URL, { prepare: false });
  return sql;
}
