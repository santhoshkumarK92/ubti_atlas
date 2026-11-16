import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { LOCAL_ROOT, verifyLocalSig } from '@/lib/storage';
import { getUser } from '@/lib/auth';

// Local-mode upload target (streams to ./uploads). In Firebase mode files go straight to Cloud Storage.
export async function PUT(req: Request) {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const url = new URL(req.url);
  const p = url.searchParams.get('path') || '';
  const sig = url.searchParams.get('sig') || '';
  if (!verifyLocalSig(p, sig)) return NextResponse.json({ error: 'Bad signature' }, { status: 403 });
  if (!req.body) return NextResponse.json({ error: 'Empty body' }, { status: 400 });
  const full = path.join(LOCAL_ROOT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  await pipeline(Readable.fromWeb(req.body as never), fs.createWriteStream(full));
  return NextResponse.json({ ok: true });
}
