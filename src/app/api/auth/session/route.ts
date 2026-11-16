import { NextResponse } from 'next/server';
import { config, useFirebase } from '@/lib/config';
import { endSession, startSession, upsertUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { idToken?: string; email?: string; password?: string; name?: string };
  try {
    if (useFirebase) {
      if (!body.idToken) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
      const { adminAuth } = await import('@/lib/firebase-admin');
      const t = await adminAuth().verifyIdToken(body.idToken);
      const email = (t.email || '').toLowerCase();
      if (!email) return NextResponse.json({ error: 'Your account has no email address' }, { status: 403 });
      const domain = email.split('@')[1] ?? '';
      if (config.allowedDomains.length && !config.allowedDomains.includes(domain)) {
        return NextResponse.json({ error: `Sign-in is limited to ${config.allowedDomains.join(', ')} accounts` }, { status: 403 });
      }
      const user = await upsertUser({ id: t.uid, email, name: (t.name as string) || body.name || '' });
      await startSession(user);
      return NextResponse.json({ ok: true, role: user.role });
    }

    // LOCAL MODE — single shared password, any email
    const email = (body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Enter your email' }, { status: 400 });
    if (body.password !== config.demoPassword) return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
    const user = await upsertUser({ id: `local-${slugify(email)}`, email, name: body.name || email.split('@')[0]! });
    await startSession(user);
    return NextResponse.json({ ok: true, role: user.role });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function DELETE() {
  await endSession();
  return NextResponse.json({ ok: true });
}
