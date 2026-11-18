/**
 * Seed Firestore with industries, systems, certifications, company settings and sample projects.
 *   npm run seed          → adds anything missing (never overwrites)
 *   npm run seed:reset    → overwrites seed documents with the defaults
 *   npm run seed -- --only=platforms   → seed only the named collections
 *   npm run seed -- --fill-missing     → also complete existing documents' empty fields (keeps their values)
 * Reads FIREBASE_* from .env.local.
 */
import fs from 'node:fs';
import path from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { buildSeed } from '../src/data/seed';

for (const f of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, '');
  }
}

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error('Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env.local');
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }) });
const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });
const reset = process.argv.includes('--reset');
// --only=platforms,certifications  → seed just those collections (e.g. to avoid touching industries)
// --fill-missing  → for documents that already exist, fill in only their empty fields from the seed (never overwrites values)
const fillMissing = process.argv.includes('--fill-missing');
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',').filter(Boolean);

(async () => {
  const seed = buildSeed();
  let added = 0, skipped = 0, filled = 0;
  for (const [col, docs] of Object.entries(seed)) {
    if (only && !only.includes(col)) continue;
    for (const d of docs as { id: string }[]) {
      const ref = db.collection(col).doc(d.id);
      const { id, ...data } = d;
      void id;
      const snap = !reset ? await ref.get() : null;
      if (snap?.exists) {
        if (fillMissing) {
          const cur = snap.data() as Record<string, unknown>;
          const patch = Object.fromEntries(Object.entries(data).filter(([k, v]) => v !== undefined && (cur[k] === undefined || cur[k] === null || cur[k] === '')));
          if (Object.keys(patch).length) { await ref.update(patch); filled++; continue; }
        }
        skipped++;
        continue;
      }
      await ref.set(data);
      added++;
    }
    console.log(`  ${col}: ${(docs as unknown[]).length}`);
  }
  console.log(`\nDone — ${added} written, ${skipped} already existed.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
