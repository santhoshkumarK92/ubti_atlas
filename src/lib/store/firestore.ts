import 'server-only';
import { FieldValue, type DocumentData, type Query as FsQuery } from 'firebase-admin/firestore';
import { adminDb } from '../firebase-admin';
import type { CollectionName } from '../types';
import { applyQuery, cosine, withDefaults, type Store } from './index';

/** Fields stored as Firestore vectors (for KNN search). */
const VECTOR_FIELDS: Partial<Record<CollectionName, string>> = { projects: 'embedding' };

function toFirestore(col: CollectionName, data: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...data };
  delete out.id;
  const vf = VECTOR_FIELDS[col];
  if (vf && Array.isArray(out[vf])) out[vf] = FieldValue.vector(out[vf] as number[]);
  return out;
}

function fromFirestore(col: CollectionName, id: string, data: DocumentData) {
  const out: Record<string, unknown> = { ...data, id };
  for (const [k, v] of Object.entries(out)) {
    if (!v || typeof v !== 'object') continue;
    const o = v as { toArray?: () => number[]; toDate?: () => Date };
    if (typeof o.toArray === 'function') out[k] = o.toArray(); // VectorValue
    else if (typeof o.toDate === 'function') out[k] = o.toDate().toISOString(); // Timestamp
  }
  return withDefaults(col, out);
}

export function createFirestoreStore(): Store {
  const db = adminDb();

  return {
    kind: 'firestore',
    async list(col, q) {
      let ref: FsQuery = db.collection(col);
      for (const [f, op, v] of q?.where ?? []) ref = ref.where(f, op, v);
      const snap = await ref.get();
      const rows = snap.docs.map((d) => fromFirestore(col, d.id, d.data()));
      // where already applied server-side; sort + limit in memory (no composite indexes)
      return applyQuery(rows, { orderBy: q?.orderBy, limit: q?.limit }) as never;
    },
    async get(col, id) {
      if (!id) return null;
      const d = await db.collection(col).doc(id).get();
      return (d.exists ? fromFirestore(col, d.id, d.data()!) : null) as never;
    },
    async create(col, data) {
      const given = (data as { id?: string }).id;
      const ref = given ? db.collection(col).doc(given) : db.collection(col).doc();
      await ref.set(toFirestore(col, data as Record<string, unknown>));
      return ref.id;
    },
    async set(col, id, data) {
      await db.collection(col).doc(id).set(toFirestore(col, data as Record<string, unknown>));
    },
    async update(col, id, patch) {
      const p = toFirestore(col, patch as Record<string, unknown>);
      for (const [k, v] of Object.entries(patch)) if (v === undefined) p[k] = FieldValue.delete();
      await db.collection(col).doc(id).update(p);
    },
    async remove(col, id) {
      await db.collection(col).doc(id).delete();
    },
    async nearest(col, field, vector, k) {
      try {
        const snap = await db
          .collection(col)
          .findNearest({ vectorField: field, queryVector: vector, limit: k, distanceMeasure: 'COSINE' })
          .get();
        return snap.docs.map((d) => fromFirestore(col, d.id, d.data())) as never;
      } catch (e) {
        // Vector index not created yet → fall back to in-memory cosine similarity.
        console.warn('[atlas] findNearest failed, using in-memory fallback:', (e as Error).message);
        const snap = await db.collection(col).get();
        const rows = snap.docs.map((d) => fromFirestore(col, d.id, d.data())).filter((r) => Array.isArray(r[field]));
        return rows
          .map((r) => ({ r, s: cosine(vector, r[field] as number[]) }))
          .sort((a, b) => b.s - a.s)
          .slice(0, k)
          .map((x) => x.r) as never;
      }
    },
  };
}
