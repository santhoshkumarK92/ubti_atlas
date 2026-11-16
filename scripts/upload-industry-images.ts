/**
 * Upload local industry photos to Firebase Storage and point each industry at them.
 *
 *   npm run upload:industries -- "C:\path\to\images"            → upload + update Firestore
 *   npm run upload:industries -- "C:\path\to\images" --dry-run  → only show the matching
 *
 * Name each file after its industry (slug, full name or short name all work):
 *   real-estate.jpg · Real Estate.png · oil-gas.webp · financial-services.jpg …
 * Matching ignores case, spaces, dashes and "&". Reads FIREBASE_* from .env.local / .env.
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

for (const f of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, '');
  }
}

const dir = process.argv.slice(2).find((a) => !a.startsWith('--'));
const dryRun = process.argv.includes('--dry-run');
if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error('Usage: npm run upload:industries -- "<folder with images>" [--dry-run]');
  process.exit(1);
}

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET } = process.env;
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error('Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env.local');
  process.exit(1);
}

const app = initializeApp({
  credential: cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }),
  storageBucket: FIREBASE_STORAGE_BUCKET || `${FIREBASE_PROJECT_ID}.firebasestorage.app`,
});
const db = getFirestore(app);
const bucket = getStorage(app).bucket();

const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif' };
const norm = (s: string) => s.toLowerCase().replace(/&/g, '').replace(/[^a-z0-9]/g, '');

interface Ind { id: string; slug: string; name: string; shortName: string }

(async () => {
  const inds = (await db.collection('industries').get()).docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ind, 'id'>) }));
  if (!inds.length) { console.error('No industries in Firestore yet — run `npm run seed` first.'); process.exit(1); }

  if (process.argv.includes('--verify')) {
    // Report where each industry image comes from and whether the URL actually loads.
    for (const d of (await db.collection('industries').get()).docs) {
      const u = String((d.data() as { imageUrl?: string }).imageUrl ?? '');
      const fb = u.includes('firebasestorage.googleapis.com');
      let status = '';
      if (fb) { const r = await fetch(u); status = `HTTP ${r.status} ${r.headers.get('content-type')} ${(await r.arrayBuffer()).byteLength} bytes`; }
      console.log(`  ${d.id.padEnd(20)} ${fb ? 'FIREBASE' : 'OTHER   '} ${fb ? status : u.slice(0, 50)}`);
    }
    process.exit(0);
  }

  const files = fs.readdirSync(dir).filter((f) => MIME[path.extname(f).toLowerCase()]);
  // Score = longest shared prefix with any of an industry's names (≥5 chars, or exact), so
  // "Finance" → financial-services and "Governmant & Public sector" → government still match.
  const lcp = (a: string, b: string) => { let n = 0; while (n < a.length && n < b.length && a[n] === b[n]) n++; return n; };
  const matchFiles = (list: Ind[], fileList: string[] = files) => {
    const matched = new Map<string, string>(); // industry id -> file
    const unmatched: string[] = [];
    for (const f of fileList) {
      const key = norm(path.basename(f, path.extname(f)));
      const scored = list
        .map((i) => ({
          i,
          best: Math.max(...[i.id, i.slug, i.name, i.shortName].filter(Boolean).map((k) => {
            const nk = norm(k);
            return nk === key ? 99 : lcp(key, nk) >= 5 ? lcp(key, nk) : 0;
          })),
        }))
        .filter((x) => x.best > 0)
        .sort((a, b) => b.best - a.best);
      const top = scored[0];
      if (top && scored[1]?.best !== top.best && !matched.has(top.i.id)) matched.set(top.i.id, f);
      else unmatched.push(f);
    }
    return { matched, unmatched };
  };

  let { matched, unmatched } = matchFiles(inds);

  // --add-missing: create industries (from the app's seed list) for images that match no existing industry.
  if (process.argv.includes('--add-missing')) {
    const { industries: seedInds } = await import('../src/data/seed');
    const have = new Set(inds.map((i) => i.id));
    const candidates = seedInds.filter((i) => !have.has(i.id));
    const { matched: extra } = matchFiles(candidates as unknown as Ind[], unmatched);
    let order = Math.max(0, ...inds.map((i) => Number((i as unknown as { order?: number }).order) || 0));
    for (const id of extra.keys()) {
      const seed = candidates.find((i) => i.id === id)!;
      const { id: _id, ...data } = seed;
      void _id;
      console.log(`  + ${dryRun ? 'would create' : 'creating'} industry "${seed.name}" (${id})`);
      if (!dryRun) await db.collection('industries').doc(id).set({ ...data, order: ++order });
      inds.push({ id, slug: seed.slug, name: seed.name, shortName: seed.shortName });
    }
    ({ matched, unmatched } = matchFiles(inds));
  }

  console.log(`\nFound ${files.length} image(s) in ${dir}\n`);
  for (const i of inds) console.log(`  ${matched.has(i.id) ? '✔' : '✘'} ${i.id.padEnd(20)} ${matched.get(i.id) ?? '— no image matched, keeps its current photo'}`);
  if (unmatched.length) console.log(`\nNot matched to any industry: ${unmatched.join(', ')}`);
  if (dryRun) { console.log('\nDry run — nothing uploaded.'); process.exit(0); }

  let done = 0;
  for (const [id, f] of matched) {
    const ext = path.extname(f).toLowerCase();
    const dest = `industries/${id}-${Date.now().toString(36)}${ext}`;
    const token = randomUUID();
    await bucket.file(dest).save(fs.readFileSync(path.join(dir, f)), {
      contentType: MIME[ext],
      resumable: false,
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });
    // Same URL format the app's storage.ts produces
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(dest)}?alt=media&token=${token}`;
    await db.collection('industries').doc(id).update({ imageUrl: url, imagePath: dest });
    console.log(`  uploaded ${f} → ${dest}`);
    done++;
  }
  console.log(`\nDone — ${done} industry image(s) now served from Firebase Storage.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
