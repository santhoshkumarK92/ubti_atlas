import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { nowIso } from '@/lib/utils';

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  // simple honeypot
  if (b.website) return NextResponse.json({ ok: true });
  const name = (b.name || '').trim().slice(0, 120);
  const email = (b.email || '').trim().slice(0, 160);
  const message = (b.message || '').trim().slice(0, 4000);
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Please add your name and a valid email.' }, { status: 400 });
  const store = await getStore();
  await store.create('leads', {
    name,
    email,
    company: (b.company || '').slice(0, 160) || undefined,
    phone: (b.phone || '').slice(0, 40) || undefined,
    industryId: b.industryId || undefined,
    message,
    source: (b.source || 'contact').slice(0, 120),
    status: 'new',
    createdAt: nowIso(),
  });
  return NextResponse.json({ ok: true });
}
