import 'server-only';
import type { CollectionName, Collections } from '../types';
import { useFirebase } from '../config';

export type WhereOp = '==' | 'array-contains' | 'in';
export type Where = [field: string, op: WhereOp, value: unknown];
export interface Query {
  where?: Where[];
  orderBy?: [field: string, dir: 'asc' | 'desc'];
  limit?: number;
}

/**
 * Minimal document store used by the whole app. Two implementations:
 *  - Firestore (production)
 *  - Local JSON file in .data/db.json (no setup needed, for development/demo)
 * Sorting and limits are applied in memory so no composite indexes are needed.
 */
export interface Store {
  readonly kind: 'firestore' | 'local';
  list<C extends CollectionName>(col: C, q?: Query): Promise<Collections[C][]>;
  get<C extends CollectionName>(col: C, id: string): Promise<Collections[C] | null>;
  create<C extends CollectionName>(col: C, data: Omit<Collections[C], 'id'> & { id?: string }): Promise<string>;
  set<C extends CollectionName>(col: C, id: string, data: Omit<Collections[C], 'id'>): Promise<void>;
  update<C extends CollectionName>(col: C, id: string, patch: Partial<Collections[C]> & Record<string, unknown>): Promise<void>;
  remove(col: CollectionName, id: string): Promise<void>;
  /** K-nearest-neighbour search over a vector field. */
  nearest<C extends CollectionName>(col: C, field: string, vector: number[], k: number): Promise<Collections[C][]>;
}

const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/**
 * Fill in list/object fields that older or hand-made documents may lack, so the UI can
 * always call `.map` / `.includes` / `.length` safely. Applied on every read by both stores.
 */
export function withDefaults<T>(col: CollectionName, doc: T): T {
  const d = doc as Record<string, unknown>;
  if (!d || typeof d !== 'object') return doc;
  switch (col) {
    case 'projects':
      return {
        ...d,
        extraIndustryIds: arr(d.extraIndustryIds), metrics: arr(d.metrics), features: arr(d.features),
        techStack: arr(d.techStack), platformIds: arr(d.platformIds),
        architecture: { ...obj(d.architecture), flow: arr(obj(d.architecture).flow), description: String(obj(d.architecture).description ?? '') },
        media: { ...obj(d.media), screenshots: arr(obj(d.media).screenshots) },
      } as T;
    case 'industries':
      // Hand-made documents may lack a slug / short name; the document id is a safe slug.
      return { ...d, slug: d.slug || d.id, shortName: d.shortName || d.name || d.id, icon: d.icon || 'Briefcase', description: d.description ?? '' } as T;
    case 'posts':
      return { ...d, tags: arr(d.tags), projectIds: arr(d.projectIds) } as T;
    case 'pitches':
      return { ...d, projectIds: arr(d.projectIds), reframes: obj(d.reframes) } as T;
    case 'platforms':
      return { ...d, slug: d.slug || d.id, aiPatterns: arr(d.aiPatterns) } as T;
    case 'company':
      return { ...d, stats: arr(d.stats), capabilities: arr(d.capabilities), offices: arr(d.offices) } as T;
    default:
      return doc;
  }
}

export function applyQuery<T>(rows: T[], q?: Query): T[] {
  let out = rows;
  for (const [f, op, v] of q?.where ?? []) {
    out = out.filter((r) => {
      const val = (r as Record<string, unknown>)[f];
      if (op === '==') return val === v;
      if (op === 'array-contains') return Array.isArray(val) && val.includes(v);
      if (op === 'in') return Array.isArray(v) && v.includes(val);
      return true;
    });
  }
  if (q?.orderBy) {
    const [f, dir] = q.orderBy;
    out = [...out].sort((a, b) => {
      const av = (a as Record<string, unknown>)[f] as string | number | undefined;
      const bv = (b as Record<string, unknown>)[f] as string | number | undefined;
      if (av === bv) return 0;
      if (av === undefined) return 1;
      if (bv === undefined) return -1;
      return (av < bv ? -1 : 1) * (dir === 'asc' ? 1 : -1);
    });
  }
  if (q?.limit) out = out.slice(0, q.limit);
  return out;
}

export function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

const g = globalThis as unknown as { __atlasStoreV2?: Promise<Store> };

export function getStore(): Promise<Store> {
  if (!g.__atlasStoreV2) {
    const p = useFirebase
      ? import('./firestore').then((m) => m.createFirestoreStore())
      : import('./local').then((m) => m.createLocalStore());
    // Never cache a failed start-up, or every later request would reuse the rejection.
    p.catch(() => { if (g.__atlasStoreV2 === p) g.__atlasStoreV2 = undefined; });
    g.__atlasStoreV2 = p;
  }
  return g.__atlasStoreV2;
}
