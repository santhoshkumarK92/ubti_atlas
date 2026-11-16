import clsx, { type ClassValue } from 'clsx';

export const cn = (...v: ClassValue[]) => clsx(v);

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const nowIso = () => new Date().toISOString();

export function randomId(len = 20) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}

export function formatDate(iso?: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en-GB', opts).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function timeAgo(iso?: string) {
  if (!iso) return 'never';
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function readingMinutes(md: string) {
  return Math.max(1, Math.round(md.split(/\s+/).length / 220));
}

export function initials(name: string) {
  return name
    .split(/[\s&/-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export function unsplash(id: string, w = 1200) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;
}

/** Turn YouTube / Vimeo / Stream / SharePoint share links into embeddable URLs. */
export function toEmbedUrl(url?: string) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith('/embed/')) return url;
    }
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes('vimeo.com') && !u.hostname.includes('player')) {
      return `https://player.vimeo.com/video/${u.pathname.split('/').filter(Boolean)[0]}`;
    }
    if (u.hostname.includes('sharepoint.com') && !u.pathname.includes('embed')) {
      // SharePoint / Stream (on SharePoint) video: append embed action
      u.searchParams.set('embed', '{"af":true,"ust":true}');
      return u.toString();
    }
    return url;
  } catch {
    return undefined;
  }
}

export function stripEmbedding<T extends { embedding?: unknown }>(p: T): Omit<T, 'embedding'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { embedding, ...rest } = p;
  return rest;
}

export function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

export function mdToPlain(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
