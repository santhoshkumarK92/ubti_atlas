import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getStore } from './store';
import type { CompanySettings, Industry, Platform, Post, Project, Certification, Pitch } from './types';
import { stripEmbedding } from './utils';
import { company as defaultCompany } from '../data/seed';
import { aiEnabled, embed } from './ai';

/** Cross-request cache (2 min, cleared instantly when staff save anything via bust()) on top of React's per-request cache. */
const shared = <A extends unknown[], R>(key: string, fn: (...a: A) => Promise<R>) =>
  cache(unstable_cache(fn, [key], { revalidate: 120, tags: ['site-data'] }));

export type PublicProject = Omit<Project, 'embedding' | 'source'>;

const lighten = (p: Project): PublicProject => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { source, ...rest } = stripEmbedding(p);
  return rest;
};

/** Hide the real client name from people who aren't signed in. */
export function forViewer(p: PublicProject, signedIn: boolean): PublicProject {
  if (signedIn) return p;
  return { ...p, clientName: undefined, clientDisplay: p.clientDisplay || 'Confidential client' };
}

export const getIndustries = shared('industries', async (): Promise<Industry[]> => {
  const s = await getStore();
  return s.list('industries', { orderBy: ['order', 'asc'] });
});

export const getPlatforms = shared('platforms', async (): Promise<Platform[]> => {
  const s = await getStore();
  return s.list('platforms', { orderBy: ['order', 'asc'] });
});

export const getCertifications = shared('certifications', async (): Promise<Certification[]> => {
  const s = await getStore();
  return s.list('certifications', { orderBy: ['order', 'asc'] });
});

export const getCompany = shared('company', async (): Promise<CompanySettings> => {
  const s = await getStore();
  return (await s.get('company', 'main')) ?? defaultCompany;
});

export const getAllProjects = cache(async (): Promise<Project[]> => {
  const s = await getStore();
  return s.list('projects', { orderBy: ['updatedAt', 'desc'] });
});

/** Published projects the current viewer may see on the main site. */
export const getVisibleProjects = shared('visible-projects', async (signedIn: boolean): Promise<PublicProject[]> => {
  const s = await getStore();
  const rows = await s.list('projects', { where: [['status', '==', 'published']], orderBy: ['publishedAt', 'desc'] });
  return rows
    .filter((p) => p.visibility === 'public' || signedIn)
    .map((p) => forViewer(lighten(p), signedIn));
});

export async function getProjectBySlug(slug: string, signedIn: boolean) {
  const s = await getStore();
  const [p] = await s.list('projects', { where: [['slug', '==', slug]] });
  if (!p) return null;
  if (p.status !== 'published' && !signedIn) return null;
  if (p.visibility !== 'public' && !signedIn) return null;
  return forViewer(lighten(p), signedIn);
}

export async function getProjectsByIds(ids: string[]) {
  if (!ids.length) return [];
  const s = await getStore();
  const rows = await Promise.all(ids.map((id) => s.get('projects', id)));
  return rows.filter((p): p is Project => !!p).map(lighten);
}

export const getPosts = shared('posts', async (type?: Post['type'], includeDrafts = false): Promise<Post[]> => {
  const s = await getStore();
  const rows = await s.list('posts', { where: type ? [['type', '==', type]] : [], orderBy: ['publishedAt', 'desc'] });
  return includeDrafts ? rows : rows.filter((p) => p.status === 'published');
});

export async function getPostBySlug(type: Post['type'], slug: string, signedIn: boolean) {
  const s = await getStore();
  const [p] = await s.list('posts', { where: [['slug', '==', slug]] });
  if (!p || p.type !== type) return null;
  if (p.status !== 'published' && !signedIn) return null;
  return p;
}

export async function getPitchBySlug(slug: string): Promise<Pitch | null> {
  const s = await getStore();
  const [p] = await s.list('pitches', { where: [['slug', '==', slug]] });
  return p ?? null;
}

export async function uniqueSlug(col: 'projects' | 'posts' | 'pitches' | 'industries' | 'platforms', base: string, selfId?: string) {
  const s = await getStore();
  let slug = base || 'item';
  for (let n = 2; n < 200; n++) {
    const [hit] = await s.list(col, { where: [['slug', '==', slug]] });
    if (!hit || hit.id === selfId) return slug;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export function projectEmbeddingText(p: Pick<Project, 'title' | 'tagline' | 'problem' | 'solution' | 'impact' | 'techStack' | 'features'>, industry?: string, platforms: string[] = []) {
  return [
    p.title,
    p.tagline,
    industry ? `Industry: ${industry}` : '',
    `Problem: ${p.problem}`,
    `Solution: ${p.solution}`,
    `Impact: ${p.impact}`,
    `Features: ${p.features.join('; ')}`,
    `Tech: ${p.techStack.join(', ')}`,
    platforms.length ? `Works with: ${platforms.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Keep the vector field in sync: published → embedded, otherwise removed. */
export async function refreshEmbedding(projectId: string) {
  const s = await getStore();
  const p = await s.get('projects', projectId);
  if (!p) return;
  if (p.status !== 'published' || !aiEnabled) {
    if (p.embedding) await s.update('projects', projectId, { embedding: undefined });
    return;
  }
  try {
    const [inds, plats] = await Promise.all([getIndustries(), getPlatforms()]);
    const ind = inds.find((i) => i.id === p.industryId)?.name;
    const pl = plats.filter((x) => p.platformIds.includes(x.id)).map((x) => x.name);
    const [vec] = await embed([projectEmbeddingText(p, ind, pl)]);
    if (vec) await s.update('projects', projectId, { embedding: vec });
  } catch (e) {
    console.warn('[atlas] embedding failed', (e as Error).message);
  }
}
