import { NextResponse } from 'next/server';
import { ADMIN_PASSWORD, makeAdminToken } from '../../../../lib/auth';

export async function POST(req) {
  const { password } = await req.json();
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin', makeAdminToken(), {
    httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 60, path: '/',
  });
  return res;
}
