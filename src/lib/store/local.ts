import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type { CollectionName } from '../types';
import { applyQuery, cosine, withDefaults, type Store } from './index';
import { buildSeed } from '../../data/seed';
import { randomId } from '../utils';

type Db = Record<string, Record<string, Record<string, unknown>>>;

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'db.json');

function load(): Db {
  try {
    if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8')) as Db;
  } catch (e) {
    console.error('[atlas] could not read .data/db.json, starting fresh', e);
  }
  const db: Db = {};
  const seed = buildSeed();
  for (const [col, docs] of Object.entries(seed)) {
    db[col] = {};
    for (const d of docs as { id: string }[]) db[col]![d.id] = d as unknown as Record<string, unknown>;
  }
  persist(db);
  return db;
}

let timer: NodeJS.Timeout | undefined;
function persist(db: Db) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, FILE);
  }, 50);
}

const clone = <T,>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

export function createLocalStore(): Store {
  const db = load();
  const bucket = (c: CollectionName) => (db[c] ??= {});

  return {
    kind: 'local',
    async list(col, q) {
      return clone(applyQuery(Object.values(bucket(col)), q)).map((r) => withDefaults(col, r)) as never;
    },
    async get(col, id) {
      const d = bucket(col)[id];
      return (d ? withDefaults(col, clone(d)) : null) as never;
    },
    async create(col, data) {
      const id = (data as { id?: string }).id || randomId();
      bucket(col)[id] = clone({ ...(data as object), id }) as Record<string, unknown>;
      persist(db);
      return id;
    },
    async set(col, id, data) {
      bucket(col)[id] = clone({ ...(data as object), id }) as Record<string, unknown>;
      persist(db);
    },
    async update(col, id, patch) {
      const cur = bucket(col)[id];
      if (!cur) throw new Error(`${col}/${id} not found`);
      const next: Record<string, unknown> = { ...cur };
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined) delete next[k];
        else next[k] = clone(v);
      }
      bucket(col)[id] = next;
      persist(db);
    },
    async remove(col, id) {
      delete bucket(col)[id];
      persist(db);
    },
    async nearest(col, field, vector, k) {
      const rows = Object.values(bucket(col)).filter((r) => Array.isArray(r[field]));
      return clone(
        rows
          .map((r) => ({ r, s: cosine(vector, r[field] as number[]) }))
          .sort((a, b) => b.s - a.s)
          .slice(0, k)
          .map((x) => withDefaults(col, x.r)),
      ) as never;
    },
  };
}
