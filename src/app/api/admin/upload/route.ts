import { NextResponse } from 'next/server';
import { getUser, can } from '@/lib/auth';
import { createUploadTicket } from '@/lib/storage';
import { config } from '@/lib/config';

/** Returns a one-time upload URL. The browser then PUTs the file directly. */
export async function POST(req: Request) {
  const u = await getUser();
  if (!u || !(can(u.role, 'projects.edit') || can(u.role, 'pitches.edit') || can(u.role, 'posts.edit') || can(u.role, 'settings.edit'))) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }
  const { fileName, contentType, folder, size } = (await req.json()) as { fileName: string; contentType: string; folder: string; size?: number };
  if (!fileName || !folder) return NextResponse.json({ error: 'fileName and folder are required' }, { status: 400 });
  if (size && size > config.maxUploadMb * 1024 * 1024) {
    return NextResponse.json({ error: `File is larger than ${config.maxUploadMb} MB. Use a YouTube / Stream link for long videos.` }, { status: 413 });
  }
  try {
    return NextResponse.json(await createUploadTicket(folder, fileName, contentType));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
