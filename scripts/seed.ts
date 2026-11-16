/**
 * Seed Firestore with industries, systems, certifications, company settings and sample projects.
 *   npm run seed          → adds anything missing (never overwrites)
 *   npm run seed:reset    → overwrites seed documents with the defaults
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

(async () => {
  const seed = buildSeed();
  let added = 0, skipped = 0;
  for (const [col, docs] of Object.entries(seed)) {
    for (const d of docs as { id: string }[]) {
      const ref = db.collection(col).doc(d.id);
      if (!reset && (await ref.get()).exists) { skipped++; continue; }
      const { id, ...data } = d;
      void id;
      await ref.set(data);
      added++;
    }
    console.log(`  ${col}: ${(docs as unknown[]).length}`);
  }
  console.log(`\nDone — ${added} written, ${skipped} already existed.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
