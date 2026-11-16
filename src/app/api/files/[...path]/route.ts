import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { LOCAL_ROOT, mimeFromName } from '@/lib/storage';

// Serves local-mode uploads with HTTP Range support so videos can seek.
export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const rel = parts.map(decodeURIComponent).join('/');
  if (rel.includes('..')) return new Response('Bad path', { status: 400 });
  const full = path.join(LOCAL_ROOT, rel);
  if (!fs.existsSync(full)) return new Response('Not found', { status: 404 });
  const size = fs.statSync(full).size;
  const type = mimeFromName(full);
  const headers: Record<string, string> = {
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
  };
  if (type === 'image/svg+xml') headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";

  const range = req.headers.get('range');
  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    const start = m?.[1] ? Number(m[1]) : 0;
    const end = m?.[2] ? Math.min(Number(m[2]), size - 1) : Math.min(start + 4 * 1024 * 1024, size - 1);
    if (start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    const stream = fs.createReadStream(full, { start, end });
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) },
    });
  }
  return new Response(Readable.toWeb(fs.createReadStream(full)) as ReadableStream, { headers: { ...headers, 'Content-Length': String(size) } });
}
