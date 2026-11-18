/**
 * Fetch a brand logo for every system ("platform"), keep a local copy, optionally upload to
 * Firebase Storage and set `logoUrl` on the platform document.
 *
 *   npm run logos -- --preview         download + write a contact sheet (nothing uploaded)
 *   npm run logos -- --upload          download + upload + update Firestore (skips systems that already have a logo)
 *   npm run logos -- --upload --force  also replace existing logos
 *   add --only=sap-ecc,hubspot to limit to specific platform ids
 *
 * Sources, tried in order for each system (first one that works wins):
 *   iconify  – api.iconify.design  (full-colour brand marks from the "logos" / "devicon" sets)
 *   si       – cdn.simpleicons.org (Simple Icons, drawn in the brand's official colour)
 *   gh       – Microsoft's official Azure / Dynamics icons, mirrored in github.com/benc-uk/icon-collection
 *   fav      – the vendor website's own icon via Google's favicon service
 * Logos are trademarks of their owners and are shown only to identify the system.
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp, { type OverlayOptions } from 'sharp';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

type Src = string; // full URL
const iconify = (prefix: string, name: string, color?: string): Src =>
  `https://api.iconify.design/${prefix}/${name}.svg${color ? `?color=${encodeURIComponent(color)}` : ''}`;
const si = (slug: string): Src => `https://cdn.simpleicons.org/${slug}`;
const gh = (p: string): Src => `https://raw.githubusercontent.com/benc-uk/icon-collection/master/${p}`;
const fav = (domain: string): Src => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

const DYN = gh('logos/dynamics.svg');
const SAP = iconify('logos', 'sap');
const ORACLE = iconify('logos', 'oracle');
const SF = iconify('logos', 'salesforce');
const ZOHO = iconify('logos', 'zoho');

/** platform id → candidate logo URLs (best first). Ids without an entry keep their initials. */
const MAP: Record<string, Src[]> = {
  'microsoft-fabric': [fav('fabric.microsoft.com')],
  'azure-synapse-analytics': [gh('azure-icons/Azure-Synapse-Analytics.svg')],
  'azure-databricks': [iconify('logos', 'databricks-icon')],
  snowflake: [iconify('logos', 'snowflake-icon')],
  'google-bigquery': [si('googlebigquery')],
  'amazon-redshift': [iconify('logos', 'aws-redshift')],
  'azure-data-lake-storage': [gh('azure-icons/Data-Lake-Storage-Gen1.svg')],
  'amazon-s3': [iconify('logos', 'aws-s3')],
  'power-bi': [iconify('logos', 'microsoft-power-bi')],
  tableau: [iconify('logos', 'tableau-icon')],
  'sql-server': [iconify('devicon', 'microsoftsqlserver')],
  'azure-sql-database': [iconify('devicon', 'azuresqldatabase')],
  postgresql: [iconify('logos', 'postgresql')],
  'mysql-mariadb': [iconify('logos', 'mysql')],
  'oracle-database': [ORACLE],
  'ibm-db2': [iconify('carbon', 'ibm-db2', '#0f62fe')],
  'sap-hana': [SAP],
  teradata: [si('teradata')],
  'azure-cosmos-db': [gh('azure-icons/Azure-Cosmos-DB.svg')],
  mongodb: [iconify('logos', 'mongodb-icon')],
  'amazon-dynamodb': [iconify('logos', 'aws-dynamodb')],
  'apache-cassandra': [iconify('logos', 'cassandra')],
  redis: [iconify('logos', 'redis')],
  'elasticsearch-opensearch': [si('elasticsearch')],
  'azure-ai-search': [gh('azure-docs/cognitive-search.svg'), gh('azure-docs/search.svg')],
  'firebase-firestore': [iconify('logos', 'firebase-icon')],
  neo4j: [iconify('logos', 'neo4j')],
  'dynamics-365-finance-and-operations': [DYN],
  'dynamics-365-business-central': [DYN],
  'sap-s-4hana': [SAP],
  'sap-ecc': [SAP],
  'oracle-fusion-cloud-erp': [ORACLE],
  'oracle-e-business-suite': [ORACLE],
  'oracle-netsuite': [fav('netsuite.com')],
  odoo: [si('odoo')],
  'infor-cloudsuite': [fav('infor.com')],
  'tally-prime': [fav('tallysolutions.com')],
  'zoho-books': [ZOHO],
  sage: [si('sage')],
  'dynamics-365-sales': [DYN],
  'dynamics-365-customer-service': [DYN],
  dataverse: [fav('powerapps.microsoft.com')],
  'salesforce-sales-cloud': [SF],
  'salesforce-service-cloud': [SF],
  hubspot: [iconify('logos', 'hubspot')],
  'zoho-crm': [ZOHO],
  zendesk: [iconify('logos', 'zendesk-icon')],
  'freshdesk-freshservice': [fav('freshworks.com')],
  servicenow: [iconify('devicon', 'servicenow')],
  'jira-and-jira-service-management': [iconify('logos', 'jira')],
  workday: [fav('workday.com')],
  'sap-successfactors': [SAP],
  'ibm-maximo': [iconify('carbon', 'ibm-maximo-application-suite', '#0f62fe')],
  sharepoint: [gh('azure-patterns/sharepoint.svg'), fav('sharepoint.com')],
  onedrive: [iconify('logos', 'microsoft-onedrive')],
  'microsoft-teams': [iconify('logos', 'microsoft-teams')],
  'outlook-exchange': [iconify('vscode-icons', 'file-type-outlook')],
  'excel-and-csv-files': [iconify('vscode-icons', 'file-type-excel')],
  'pdfs-and-scanned-documents': [iconify('vscode-icons', 'file-type-pdf2')],
  'google-drive-workspace': [iconify('logos', 'google-drive')],
  box: [iconify('logos', 'box')],
  confluence: [iconify('logos', 'confluence')],
  shopify: [iconify('logos', 'shopify')],
  'adobe-commerce-magento': [iconify('devicon', 'magento')],
  'aveva-pi-system': [fav('aveva.com')],
  procore: [fav('procore.com')],
  yardi: [fav('yardi.com')],
  guidewire: [fav('guidewire.com')],
  'hl7-fhir-ehr-systems': [fav('hl7.org')],
  cargowise: [fav('cargowise.com')],
  'apache-kafka': [iconify('logos', 'kafka-icon')],
  'azure-event-hubs': [gh('azure-docs/event-hubs.svg')],
  'azure-iot-hub': [gh('azure-icons/IoT-Hub.svg')],
  'mqtt-opc-ua': [si('mqtt')],
  'rest-and-graphql-apis': [iconify('logos', 'graphql')],
  // 'sftp-edi-feeds' is not a product — it keeps its initials badge.
};

// ─── env + CLI ───────────────────────────────────────────────────────────────
for (const f of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, '');
  }
}
const args = process.argv.slice(2);
const upload = args.includes('--upload');
const force = args.includes('--force');
const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',').filter(Boolean);
if (!upload && !args.includes('--preview')) {
  console.error('Usage: npm run logos -- --preview | --upload [--force] [--only=id,id]');
  process.exit(1);
}

const CACHE = path.join(process.cwd(), '.data', 'logo-cache');
fs.mkdirSync(CACHE, { recursive: true });
const MIME: Record<string, string> = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

async function download(url: string): Promise<{ data: Buffer; ext: string } | null> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (logo fetch)' }, signal: AbortSignal.timeout(20000), redirect: 'follow' });
    if (!r.ok) return null;
    const data = Buffer.from(await r.arrayBuffer());
    if (data.length < 80) return null;
    const type = r.headers.get('content-type') || '';
    if (type.includes('svg') || data.subarray(0, 400).toString('utf8').includes('<svg')) {
      return data.toString('utf8').includes('<svg') ? { data, ext: 'svg' } : null;
    }
    if (type.includes('png')) return { data, ext: 'png' };
    if (type.includes('jpeg')) return { data, ext: 'jpg' };
    if (type.includes('webp')) return { data, ext: 'webp' };
    return null;
  } catch {
    return null;
  }
}

(async () => {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) { console.error('Missing FIREBASE_* in .env'); process.exit(1); }
  const app = initializeApp({
    credential: cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }),
    storageBucket: FIREBASE_STORAGE_BUCKET || `${FIREBASE_PROJECT_ID}.firebasestorage.app`,
  });
  const db = getFirestore(app);
  const bucket = getStorage(app).bucket();

  const docs = (await db.collection('platforms').get()).docs.filter((d) => !only || only.includes(d.id));
  const results: { id: string; name: string; file?: string; src?: string; note?: string; had?: boolean }[] = [];

  for (const d of docs) {
    const x = d.data() as { name: string; logoUrl?: string };
    const row: (typeof results)[number] = { id: d.id, name: x.name, had: !!x.logoUrl };
    const cached = ['svg', 'png', 'jpg', 'webp'].map((e) => path.join(CACHE, `${d.id}.${e}`)).find((f) => fs.existsSync(f) && !only);
    if (cached) { row.file = cached; row.src = 'cache'; }
    else {
      for (const url of MAP[d.id] ?? []) {
        const got = await download(url);
        if (!got) continue;
        row.file = path.join(CACHE, `${d.id}.${got.ext}`);
        fs.writeFileSync(row.file, got.data);
        row.src = new URL(url).hostname.replace('api.', '').replace('cdn.', '').replace('raw.githubusercontent.com', 'ms-official-icons').replace('www.google.com', 'favicon');
        break;
      }
    }
    if (!row.file) row.note = MAP[d.id] ? 'download failed' : 'no logo (initials kept)';
    else if (/\.(png|jpg|webp)$/.test(row.file)) {
      const m = await sharp(row.file).metadata();
      if ((m.width ?? 0) < 64) row.note = `low-res ${m.width}px`;
    }
    results.push(row);
  }

  // ── report
  for (const r of results) console.log(`  ${r.file ? '✔' : '✘'} ${r.id.padEnd(38)} ${(r.src ?? '').padEnd(18)} ${r.note ?? ''}`);
  console.log(`\n${results.filter((r) => r.file).length}/${results.length} systems have a logo.`);

  // ── contact sheet for eyeballing
  const withLogo = results.filter((r) => r.file);
  const cols = 8, cell = 150, pad = 10;
  const rows = Math.ceil(results.length / cols);
  const sheetPath = path.join(CACHE, '_contact-sheet.png');
  const tiles = await Promise.all(results.map(async (r, i) => {
    const left = (i % cols) * cell + pad, top = Math.floor(i / cols) * cell + pad;
    const parts: OverlayOptions[] = [];
    if (r.file) {
      const img = await sharp(r.file, { density: 300 }).resize(80, 80, { fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).png().toBuffer();
      parts.push({ input: img, left: left + 25, top });
    }
    const label = `<svg xmlns="http://www.w3.org/2000/svg" width="${cell - 10}" height="40"><text x="${(cell - 10) / 2}" y="14" font-size="11" font-family="Arial" text-anchor="middle" fill="#222">${r.name.slice(0, 22).replace(/&/g, '&amp;')}</text><text x="${(cell - 10) / 2}" y="30" font-size="9" font-family="Arial" text-anchor="middle" fill="#888">${r.file ? r.src : 'NO LOGO'}</text></svg>`;
    parts.push({ input: Buffer.from(label), left: left - 0, top: top + 84 });
    return parts;
  }));
  await sharp({ create: { width: cols * cell + pad, height: rows * cell + pad, channels: 3, background: '#ffffff' } })
    .composite(tiles.flat()).png().toFile(sheetPath);
  console.log(`Contact sheet: ${sheetPath}`);
  void withLogo;

  if (!upload) { console.log('\nPreview only — nothing uploaded.'); process.exit(0); }

  let done = 0, skipped = 0;
  for (const r of results) {
    if (!r.file) continue;
    if (r.had && !force) { skipped++; continue; }
    const ext = path.extname(r.file).slice(1);
    const dest = `platforms/${r.id}-${Date.now().toString(36)}.${ext}`;
    const token = randomUUID();
    await bucket.file(dest).save(fs.readFileSync(r.file), {
      contentType: MIME[ext] ?? 'application/octet-stream',
      resumable: false,
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(dest)}?alt=media&token=${token}`;
    await db.collection('platforms').doc(r.id).update({ logoUrl: url });
    done++;
  }
  console.log(`\nUploaded ${done} logo(s) to Firebase Storage${skipped ? `; kept ${skipped} that already had one (use --force to replace)` : ''}.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
