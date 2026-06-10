import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { isAdmin } from '../../../../lib/auth';

export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { stage, home, away, kickoff, venue } = await req.json();
  if (!stage || !home || !away || !kickoff || isNaN(new Date(kickoff))) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  getDb().prepare(
    'INSERT INTO matches (stage, home, away, kickoff, venue) VALUES (?, ?, ?, ?, ?)'
  ).run(stage, home, away, new Date(kickoff).toISOString(), venue || '');

  return NextResponse.json({ ok: true });
}
