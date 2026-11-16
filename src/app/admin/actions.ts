'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { assertPermission } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { refreshEmbedding, uniqueSlug } from '@/lib/repo';
import { computeGaps } from '@/lib/gaps';
import type { Certification, CompanySettings, Industry, Lead, Pitch, Platform, Post, Project, ProjectStatus, Role } from '@/lib/types';
import { ROLES } from '@/lib/types';
import { nowIso, randomId, readingMinutes, slugify } from '@/lib/utils';
import { buildSeed } from '@/data/seed';

type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };
const fail = (e: unknown): { ok: false; error: string } => ({ ok: false, error: (e as Error).message || String(e) });
const bust = () => revalidatePath('/', 'layout');

// ─── Projects ───────────────────────────────────────────────────────────────
export async function createProject() {
  const u = await assertPermission('projects.edit');
  const store = await getStore();
  const t = nowIso();
  const slug = await uniqueSlug('projects', `untitled-${randomId(5)}`);
  const id = await store.create('projects', {
    slug, title: '', tagline: '', industryId: '', extraIndustryIds: [], problem: '', solution: '', impact: '', metrics: [], features: [],
    techStack: [], platformIds: [], architecture: { flow: [], description: '' }, media: { screenshots: [] }, maturity: 'poc',
    visibility: 'internal', status: 'draft', featured: false, createdBy: u.email, createdAt: t, updatedAt: t,
  } as Omit<Project, 'id'>);
  redirect(`/admin/projects/${id}?tab=source`);
}

export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'embedding' | 'source' | 'status' | 'publishedAt' | 'createdBy'> & { selectedSlides?: number[] };

export async function saveProject(id: string, input: ProjectInput): Promise<Result<{ slug: string; updatedAt: string }>> {
  try {
    await assertPermission('projects.edit');
    const store = await getStore();
    const cur = await store.get('projects', id);
    if (!cur) throw new Error('Project not found');
    const base = slugify(input.slug || input.title) || cur.slug;
    const slug = await uniqueSlug('projects', base, id);
    const { selectedSlides, ...rest } = input;
    const patch: Partial<Project> = {
      ...rest,
      slug,
      title: rest.title.trim(),
      metrics: rest.metrics.filter((m) => m.label.trim() || m.value.trim()),
      features: rest.features.map((f) => f.trim()).filter(Boolean),
      architecture: { ...rest.architecture, flow: rest.architecture.flow.filter((f) => f.title.trim()) },
      reuseScore: rest.reuseScore === undefined || Number.isNaN(rest.reuseScore) ? undefined : Math.max(0, Math.min(100, Number(rest.reuseScore))),
      weeksToDeploy: rest.weeksToDeploy ? Number(rest.weeksToDeploy) : undefined,
      demoStatus: rest.demoUrl === cur.demoUrl ? cur.demoStatus : undefined,
      updatedAt: nowIso(),
    };
    if (cur.source && selectedSlides) patch.source = { ...cur.source, selectedSlides };
    await store.update('projects', id, patch);
    if (cur.status === 'published') await refreshEmbedding(id);
    bust();
    return { ok: true, data: { slug, updatedAt: patch.updatedAt! } };
  } catch (e) {
    return fail(e);
  }
}

export async function setProjectStatus(id: string, status: ProjectStatus): Promise<Result> {
  try {
    await assertPermission(status === 'published' ? 'projects.publish' : 'projects.edit');
    const store = await getStore();
    const p = await store.get('projects', id);
    if (!p) throw new Error('Project not found');
    if (status === 'published') {
      const blocking = computeGaps(p).filter((g) => g.level === 'block');
      if (blocking.length) throw new Error(`Fix before publishing: ${blocking.map((b) => b.label).join(', ')}`);
    }
    await store.update('projects', id, { status, updatedAt: nowIso(), ...(status === 'published' && !p.publishedAt ? { publishedAt: nowIso() } : {}) });
    await refreshEmbedding(id);
    bust();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProject(id: string) {
  await assertPermission('projects.edit');
  await (await getStore()).remove('projects', id);
  bust();
  redirect('/admin/projects');
}

export async function duplicateProject(id: string) {
  const u = await assertPermission('projects.edit');
  const store = await getStore();
  const p = await store.get('projects', id);
  if (!p) throw new Error('Not found');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _old, embedding, ...rest } = p;
  const t = nowIso();
  const newId = await store.create('projects', {
    ...rest, title: `${p.title} (copy)`, slug: await uniqueSlug('projects', `${p.slug}-copy`), status: 'draft', publishedAt: undefined,
    featured: false, isSample: false, createdBy: u.email, createdAt: t, updatedAt: t,
  });
  redirect(`/admin/projects/${newId}`);
}

// ─── Pitches (Client Mode) ──────────────────────────────────────────────────
export type PitchInput = Pick<Pitch, 'clientName' | 'clientLogo' | 'industryId' | 'region' | 'context' | 'intro' | 'projectIds' | 'reframes' | 'expiresAt'>;

export async function savePitch(id: string | null, input: PitchInput): Promise<Result<{ id: string; slug: string }>> {
  try {
    const u = await assertPermission('pitches.edit');
    if (!input.clientName.trim()) throw new Error('Client name is required');
    if (!input.projectIds.length) throw new Error('Pick at least one project');
    const store = await getStore();
    const t = nowIso();
    const reframes = Object.fromEntries(Object.entries(input.reframes).filter(([k]) => input.projectIds.includes(k)));
    if (id) {
      await store.update('pitches', id, { ...input, reframes, updatedAt: t });
      const p = await store.get('pitches', id);
      bust();
      return { ok: true, data: { id, slug: p!.slug } };
    }
    // Unguessable suffix so client links can't be enumerated
    const slug = await uniqueSlug('pitches', `${slugify(input.clientName).slice(0, 40)}-${randomId(4)}`);
    const newId = await store.create('pitches', {
      ...input, reframes, slug, status: 'active', viewCount: 0, uniqueVisitors: 0, createdBy: u.email, createdByName: u.name, createdAt: t, updatedAt: t,
    });
    bust();
    return { ok: true, data: { id: newId, slug } };
  } catch (e) {
    return fail(e);
  }
}

export async function setPitchStatus(id: string, status: Pitch['status']): Promise<Result> {
  try {
    await assertPermission('pitches.edit');
    await (await getStore()).update('pitches', id, { status, updatedAt: nowIso() });
    bust();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deletePitch(id: string) {
  await assertPermission('pitches.edit');
  const store = await getStore();
  const events = await store.list('pitchEvents', { where: [['pitchId', '==', id]] });
  await Promise.all(events.map((e) => store.remove('pitchEvents', e.id)));
  await store.remove('pitches', id);
  bust();
  redirect('/admin/pitches');
}

// ─── Posts ──────────────────────────────────────────────────────────────────
export async function createPost(type: Post['type']) {
  const u = await assertPermission('posts.edit');
  const t = nowIso();
  const id = await (await getStore()).create('posts', {
    type, slug: await uniqueSlug('posts', `draft-${randomId(5)}`), title: '', excerpt: '', body: '', tags: [], author: u.name || 'UBTI AI Team',
    projectIds: [], status: 'draft', createdAt: t, updatedAt: t,
  });
  redirect(`/admin/posts/${id}`);
}

export type PostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>;

export async function savePost(id: string, input: PostInput): Promise<Result<{ slug: string }>> {
  try {
    await assertPermission('posts.edit');
    const store = await getStore();
    const cur = await store.get('posts', id);
    if (!cur) throw new Error('Post not found');
    if (input.status === 'published' && (!input.title.trim() || readingMinutes(input.body) < 1 || !input.body.trim())) throw new Error('Add a title and body before publishing');
    const slug = await uniqueSlug('posts', slugify(input.slug || input.title) || cur.slug, id);
    await store.update('posts', id, {
      ...input, slug, updatedAt: nowIso(),
      publishedAt: input.status === 'published' ? cur.publishedAt || nowIso() : cur.publishedAt,
      results: input.results?.filter((r) => r.label.trim() && r.value.trim()),
    });
    bust();
    return { ok: true, data: { slug } };
  } catch (e) {
    return fail(e);
  }
}

export async function deletePost(id: string) {
  await assertPermission('posts.edit');
  await (await getStore()).remove('posts', id);
  bust();
  redirect('/admin/posts');
}

// ─── Reference collections (industries, platforms, certifications) ─────────
type RefCol = 'industries' | 'platforms' | 'certifications';
const REF: Record<RefCol, true> = { industries: true, platforms: true, certifications: true };

export async function saveRef(col: RefCol, id: string | null, data: Partial<Industry | Platform | Certification>): Promise<Result<{ id: string }>> {
  try {
    await assertPermission('settings.edit');
    if (!REF[col]) throw new Error('Not allowed');
    const store = await getStore();
    const clean = { ...data } as Record<string, unknown>;
    delete clean.id;
    if (col !== 'certifications') {
      const name = String(clean.name ?? '');
      if (!name.trim()) throw new Error('Name is required');
      clean.slug = await uniqueSlug(col, slugify(String(clean.slug || name)), id ?? undefined);
    } else if (!String(clean.code ?? '').trim()) throw new Error('Exam code is required');
    if (id) {
      await store.update(col, id, clean);
      bust();
      return { ok: true, data: { id } };
    }
    const newId = col === 'certifications' ? slugify(String(clean.code)) || randomId() : String(clean.slug);
    const exists = await store.get(col, newId);
    const finalId = exists ? `${newId}-${randomId(4)}` : newId;
    await store.create(col, { ...(clean as object), id: finalId } as never);
    bust();
    return { ok: true, data: { id: finalId } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteRef(col: RefCol, id: string): Promise<Result> {
  try {
    await assertPermission('settings.edit');
    if (!REF[col]) throw new Error('Not allowed');
    if (col === 'industries') {
      const used = (await (await getStore()).list('projects')).filter((p) => p.industryId === id).length;
      if (used) throw new Error(`${used} project(s) use this industry — move them first.`);
    }
    await (await getStore()).remove(col, id);
    bust();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ─── Company ────────────────────────────────────────────────────────────────
export async function saveCompany(data: Omit<CompanySettings, 'id'>): Promise<Result> {
  try {
    await assertPermission('settings.edit');
    await (await getStore()).set('company', 'main', { ...data, updatedAt: nowIso() });
    bust();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ─── Leads & users ──────────────────────────────────────────────────────────
export async function setLeadStatus(id: string, status: Lead['status']) {
  await assertPermission('leads.view');
  await (await getStore()).update('leads', id, { status });
  revalidatePath('/admin/leads');
}

export async function deleteLead(id: string) {
  await assertPermission('settings.edit');
  await (await getStore()).remove('leads', id);
  revalidatePath('/admin/leads');
}

export async function setUserRole(id: string, role: Role): Promise<Result> {
  try {
    const me = await assertPermission('users.edit');
    if (!ROLES.some((r) => r.id === role)) throw new Error('Unknown role');
    if (id === me.uid && role !== 'admin') throw new Error("You can't remove your own admin role");
    await (await getStore()).update('users', id, { role });
    revalidatePath('/admin/users');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function inviteUser(email: string, name: string, role: Role): Promise<Result> {
  try {
    await assertPermission('users.edit');
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) throw new Error('Enter a valid email');
    const store = await getStore();
    const existing = (await store.list('users')).find((u) => u.email === e);
    if (existing) {
      await store.update('users', existing.id, { role });
    } else {
      // Pre-provisioned record; it is matched to the real account (by email) at first sign-in.
      await store.set('users', `pending-${slugify(e)}`, { email: e, name: name || e.split('@')[0]!, role, createdAt: nowIso() });
    }
    revalidatePath('/admin/users');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteUser(id: string): Promise<Result> {
  try {
    const me = await assertPermission('users.edit');
    if (id === me.uid) throw new Error("You can't remove yourself");
    await (await getStore()).remove('users', id);
    revalidatePath('/admin/users');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ─── Sample data ────────────────────────────────────────────────────────────
export async function loadSampleData(): Promise<Result<{ added: number }>> {
  try {
    await assertPermission('settings.edit');
    const store = await getStore();
    const seed = buildSeed();
    let added = 0;
    for (const col of ['industries', 'platforms', 'certifications', 'projects', 'posts', 'company'] as const) {
      for (const d of seed[col] as { id: string }[]) {
        if (!(await store.get(col, d.id))) {
          await store.set(col, d.id, d as never);
          added++;
        }
      }
    }
    bust();
    return { ok: true, data: { added } };
  } catch (e) {
    return fail(e);
  }
}

export async function removeSampleData(): Promise<Result<{ removed: number }>> {
  try {
    await assertPermission('settings.edit');
    const store = await getStore();
    let removed = 0;
    for (const col of ['projects', 'posts'] as const) {
      for (const d of await store.list(col)) {
        if (d.isSample) {
          await store.remove(col, d.id);
          removed++;
        }
      }
    }
    bust();
    return { ok: true, data: { removed } };
  } catch (e) {
    return fail(e);
  }
}
