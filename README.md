# UBTI AI Atlas

> **Your data could be anywhere. We bring the AI to it.**

UBTI AI Atlas is the internal portfolio of the UBTI AI team. It shows every AI agent and use case the team has built, grouped by business domain. It has three main parts:

- a **public-facing site** that sales, marketing and managers can show to clients
- an **AI-assisted admin panel**: upload a deck, AI drafts the page, a person approves it
- **Client Mode**: build a tailored client microsite in about 2 minutes, with PPT export and view tracking

It is built with Next.js 15 (App Router), TypeScript, Tailwind, Firebase (Firestore, Storage, Auth) and Azure OpenAI.

---

## 1. Run it in 2 minutes (local mode, no setup)

```bash
npm install
cp .env.example .env.local      # leave the Firebase block empty
npm run dev
```

Open http://localhost:3000. Go to **Team sign-in**, enter any email and the password `atlas-demo`. The first person to sign in becomes Admin.

Local mode keeps the database in `.data/db.json` and uploaded files in `./uploads`. It is seeded on first run with:

- 15 industries
- 76 systems we connect to (databases, ERP, CRM, ITSM, documents, streaming)
- 21 Microsoft certifications, using the official Microsoft Learn badge images
- 18 sample projects and 5 sample posts, all marked **Sample**

You can remove all sample content in one click from Admin → Dashboard.

## 2. Production setup (Firebase + Azure OpenAI)

1. **Create a Firebase project.** Enable Firestore (Native mode), Storage and Authentication.
   - In Authentication, enable **Email/Password** and **Microsoft**. For Microsoft, register an app in Entra ID and paste its client ID and secret into Firebase.
2. **Service account.** In Project settings → Service accounts, generate a key. Put `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` and `FIREBASE_STORAGE_BUCKET` in `.env.local`.
3. **Web app config.** In Project settings → Your apps → Web, copy the values into `NEXT_PUBLIC_FIREBASE_*`.
4. **Rules, indexes and CORS:**
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   gsutil cors set storage.cors.json gs://YOUR_BUCKET      # edit the origin first
   ```
   - `firestore.indexes.json` contains the **vector index** (1536 dimensions) used by "Ask the Portfolio".
   - If the index is missing, the app falls back to in-memory similarity search, so nothing breaks.
5. **Seed:** run `npm run seed`. It only adds documents that are missing. `npm run seed:reset` overwrites them.
6. **Azure OpenAI:**
   - Set `AI_PROVIDER=azure`, the endpoint and the key.
   - `AZURE_OPENAI_CHAT_DEPLOYMENT` must be a vision-capable deployment, such as gpt-4o or gpt-4.1.
   - `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` should be text-embedding-3-small.
   - To use OpenAI directly instead, set `AI_PROVIDER=openai`.
7. **Admins:** set `BOOTSTRAP_ADMIN_EMAILS=you@ubtiinc.com`. Optionally lock sign-in to your company domain with `ALLOWED_EMAIL_DOMAINS=ubtiinc.com`.
8. **Deploy.** Either option works:
   - **Firebase App Hosting:** `apphosting.yaml` is included.
   - **Azure App Service / Container Apps:** build the image with `docker build -t ubti-ai-atlas .` (standalone output).
   - Set `NEXT_PUBLIC_SITE_URL` to the public URL. Client links and decks use it.
9. **Optional link health check:** call `GET /api/cron/health?key=$CRON_SECRET` daily from Cloud Scheduler, an Azure Logic App or GitHub Actions.

## 3. How the team uses it

### One upload = one project page
**Admin → Projects → New project** opens a four-step editor:

| Step | What happens |
|---|---|
| **1 · Deck & AI draft** | Upload a **.pptx** or **.pdf**. Text, speaker notes and images are extracted for each slide. Tick the slides that belong to *this* use case (one deck can hold many use cases). Click an image to mark it as the **Diagram** or a **Screenshot**. Then click **Generate draft**. |
| **2 · Content** | Review the AI-written fields: problem, what we built, impact, ROI metrics, capabilities, tech stack, client systems, maturity, reuse score and deployment weeks. The real client name stays staff-only; the "Client shown as" name is what outsiders see. |
| **3 · Diagram, video & demo** | The architecture diagram is shown as-is on the page. **Read diagram with AI** turns it into a flow and tech tags. Upload a **screen recording** or paste a YouTube, Stream or SharePoint link (useful for localhost-only demos). Add a thumbnail, screenshots and the **live demo link**, with a **Check now** health test. |
| **4 · Review & publish** | Gap flags (for example *No ROI mentioned*, *No live link*, *Demo link is down*, *Client name may be exposed*) and a completeness score. Choose visibility (**Public** / **Client links only** / **Internal only**), then **Approve & publish**. |

You can add things later. Upload just the deck today and add the video or demo URL next week; the gap check tracks what is still missing.

### Client Mode (sales tool)
**Admin → Client Mode → New client pitch**:

1. Type the meeting context, for example *"Al Shirawi, MEP contractor, UAE, interested in RFIs and invoices"*. Pick the industry and, optionally, the systems the client runs.
2. **Suggest the best projects.** AI (or keyword scoring, if AI is off) picks 3–5 projects and **reframes each one for this client**.
3. Reorder the picks, edit the wording, then save. You get a private link: `/for/al-shirawi-x7k2`.
4. **Export PPT** produces a branded deck containing the same selection.
5. The pitch page shows **opens, unique visitors, and which project they read longest**. Staff visits are not counted. You can disable a link, or give it an expiry date.

Projects marked **Internal only** never appear on client links. Real client names are never shown on client links either.

### Other features
- **Ask the Portfolio.** A floating chat that answers only from published projects, for example "anything for invoice OCR in logistics?".
- **Plug in your stack.** On the home page, visitors click their systems and industry and see a live diagram plus matching agents.
- **AI on your stack** (`/platforms`). All 76 systems grouped by category, with what AI can do on each and how we connect.
- **Industry pages.** Each has filters and a **domain deck export** for staff.
- **About.** Company text, stats (computed live) and the certification wall. Edit holder counts, hide or delete certifications, or add new ones in Admin → Certifications.
- **Blog & case studies.** A Markdown editor. Case studies can show headline results and link to project pages.
- **Leads.** Every "Request a demo" form submission (contact page, project pages, microsites) lands in Admin → Leads.
- **Roles.** Admin, AI Team (editor), Sales/Marketing, Manager (read-only plus analytics), Viewer. You can pre-add colleagues in Admin → Users.

## 4. Project structure

```
src/
  app/
    (site)/          public pages: home, industries, projects, platforms, case-studies, blog, about, contact
    for/[slug]/      client microsites (Client Mode)
    admin/           admin panel + server actions (actions.ts)
    api/             upload, extract, ai, ask, track, leads, export/pptx, health, cron, auth
  components/site    public UI (StackPlugger, ProjectDetail, ChatWidget, MicrositeTracker …)
  components/admin   ProjectEditor, PitchEditor, PostEditor, RefEditor, Uploader …
  lib/
    store/           Firestore + local JSON implementations of one tiny Store interface
    ai.ts            Azure OpenAI / OpenAI REST client (chat, vision, embeddings)
    extract.ts       PPTX (slides, notes, images) and PDF text extraction
    intel.ts         AI drafting, diagram reading, pitch matching, keyword fallbacks
    gaps.ts          completeness rules ("No ROI mentioned" …)
    pptx.ts          branded deck export (pptxgenjs)
  data/seed.ts       industries, systems, certifications, sample content
```

## 5. Notes and limits
- **Diagrams drawn with native PowerPoint shapes or SmartArt** are not images, so they can't be extracted. Export the slide as a PNG and upload it in step 3. EMF/WMF images are skipped for the same reason.
- **Old `.ppt` files** must first be re-saved as `.pptx`.
- **Video:** uploads are capped by `MAX_UPLOAD_MB` (default 500). For long recordings, use a Stream or YouTube link to keep storage costs down.
- **Images:** industry photos are hot-linked from Unsplash (free licence), and certification badges come from Microsoft Learn. You can replace any of them in Admin. Only upload client or vendor logos you are allowed to use.
- **No AI configured?** Everything still works. Drafts are assembled from slide text, matching uses keyword scoring, and diagram reading is turned off.
