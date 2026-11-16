import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { createHmac, randomUUID } from 'node:crypto';
import { config, useFirebase } from './config';
import { adminBucket } from './firebase-admin';
import type { StoredFile } from './types';
import { slugify } from './utils';

/**
 * File storage abstraction.
 *  - Firebase: browser uploads straight to Cloud Storage with a signed URL; files are
 *    served via Firebase download-token URLs (no public bucket needed).
 *  - Local: browser PUTs to /api/admin/upload/local; files live in ./uploads and are
 *    served by /api/files/... with HTTP range support (video seeking).
 */

export const LOCAL_ROOT = path.join(process.cwd(), 'uploads');

export function safeName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase().replace(/[^.a-z0-9]/g, '');
  const base = slugify(path.basename(fileName, path.extname(fileName))) || 'file';
  return `${base}${ext}`;
}

export function buildPath(folder: string, fileName: string) {
  const clean = folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '');
  return `${clean}/${Date.now().toString(36)}-${safeName(fileName)}`;
}

const sign = (p: string) => createHmac('sha256', config.sessionSecret).update(p).digest('hex').slice(0, 32);

function firebaseUrl(bucket: string, p: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(p)}?alt=media&token=${token}`;
}

export const localUrl = (p: string) => `/api/files/${p.split('/').map(encodeURIComponent).join('/')}`;

export interface UploadTicket {
  method: 'PUT';
  uploadUrl: string;
  headers: Record<string, string>;
  file: StoredFile;
}

export async function createUploadTicket(folder: string, fileName: string, contentType: string): Promise<UploadTicket> {
  const p = buildPath(folder, fileName);
  const type = contentType || 'application/octet-stream';
  if (useFirebase) {
    const bucket = adminBucket();
    const token = randomUUID();
    const headers = { 'Content-Type': type, 'x-goog-meta-firebasestoragedownloadtokens': token };
    const [uploadUrl] = await bucket.file(p).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 30 * 60 * 1000,
      contentType: type,
      extensionHeaders: { 'x-goog-meta-firebasestoragedownloadtokens': token },
    });
    return { method: 'PUT', uploadUrl, headers, file: { path: p, url: firebaseUrl(bucket.name, p, token), name: fileName, contentType: type } };
  }
  const uploadUrl = `/api/admin/upload/local?path=${encodeURIComponent(p)}&sig=${sign(p)}`;
  return { method: 'PUT', uploadUrl, headers: { 'Content-Type': type }, file: { path: p, url: localUrl(p), name: fileName, contentType: type } };
}

export function verifyLocalSig(p: string, sig: string) {
  return sign(p) === sig && !p.includes('..');
}

/** Server-side write (used for media extracted from decks, PPT exports etc.). */
export async function putFile(folder: string, fileName: string, data: Buffer, contentType: string): Promise<StoredFile> {
  const p = buildPath(folder, fileName);
  if (useFirebase) {
    const bucket = adminBucket();
    const token = randomUUID();
    await bucket.file(p).save(data, {
      contentType,
      resumable: false,
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });
    return { path: p, url: firebaseUrl(bucket.name, p, token), name: fileName, contentType };
  }
  const full = path.join(LOCAL_ROOT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, data);
  return { path: p, url: localUrl(p), name: fileName, contentType };
}

export async function readFile(p: string): Promise<Buffer> {
  if (p.includes('..')) throw new Error('Bad path');
  if (useFirebase) {
    const [buf] = await adminBucket().file(p).download();
    return buf;
  }
  return fs.readFileSync(path.join(LOCAL_ROOT, p));
}

export async function deleteFile(p?: string) {
  if (!p || p.includes('..')) return;
  try {
    if (useFirebase) await adminBucket().file(p).delete({ ignoreNotFound: true });
    else fs.rmSync(path.join(LOCAL_ROOT, p), { force: true });
  } catch (e) {
    console.warn('[atlas] delete failed', p, (e as Error).message);
  }
}

/** Read bytes for a stored file, falling back to fetching its URL (e.g. external images). */
export async function bytesOf(f: { path?: string; url?: string }): Promise<{ data: Buffer; type: string } | null> {
  try {
    if (f.path) {
      const data = await readFile(f.path);
      return { data, type: mimeFromName(f.path) };
    }
    if (f.url && /^https?:/.test(f.url)) {
      const r = await fetch(f.url, { signal: AbortSignal.timeout(10000) });
      if (!r.ok) return null;
      return { data: Buffer.from(await r.arrayBuffer()), type: r.headers.get('content-type') || mimeFromName(f.url) };
    }
  } catch {
    return null;
  }
  return null;
}

export function mimeFromName(n: string) {
  const ext = path.extname(n.split('?')[0]!).toLowerCase();
  return (
    {
      '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
      '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.pdf': 'application/pdf',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.bmp': 'image/bmp',
    } as Record<string, string>
  )[ext] || 'application/octet-stream';
}
