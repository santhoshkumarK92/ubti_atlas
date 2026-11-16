import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession, type SessionPayload } from './session';
import { getStore } from './store';
import type { AppUser, Role } from './types';
import { config } from './config';
import { nowIso } from './utils';

export type Permission =
  | 'admin.view'
  | 'projects.edit'
  | 'projects.publish'
  | 'posts.edit'
  | 'pitches.edit'
  | 'pitches.view'
  | 'leads.view'
  | 'settings.edit'
  | 'users.edit'
  | 'internal.view';

const MATRIX: Record<Role, Permission[]> = {
  admin: ['admin.view', 'projects.edit', 'projects.publish', 'posts.edit', 'pitches.edit', 'pitches.view', 'leads.view', 'settings.edit', 'users.edit', 'internal.view'],
  editor: ['admin.view', 'projects.edit', 'projects.publish', 'posts.edit', 'pitches.edit', 'pitches.view', 'internal.view'],
  sales: ['admin.view', 'posts.edit', 'pitches.edit', 'pitches.view', 'leads.view', 'internal.view'],
  manager: ['admin.view', 'pitches.view', 'leads.view', 'internal.view'],
  viewer: ['internal.view'],
};

export const can = (role: Role | undefined, p: Permission) => !!role && MATRIX[role]?.includes(p);

/** Current user (session + fresh role from the users collection). */
export const getUser = cache(async (): Promise<(SessionPayload & { role: Role }) | null> => {
  const jar = await cookies();
  const s = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!s) return null;
  try {
    const store = await getStore();
    const u = await store.get('users', s.uid);
    if (u) return { ...s, role: u.role, name: u.name || s.name };
  } catch {
    /* fall back to the role in the token */
  }
  return s;
});

export async function requirePermission(p: Permission) {
  const u = await getUser();
  if (!u) redirect('/login');
  if (!can(u.role, p)) redirect('/admin?denied=1');
  return u;
}

/** For server actions / route handlers: throws instead of redirecting. */
export async function assertPermission(p: Permission) {
  const u = await getUser();
  if (!u) throw new Error('Not signed in');
  if (!can(u.role, p)) throw new Error('You do not have permission for this action');
  return u;
}

export async function startSession(user: AppUser) {
  const token = await signSession({ uid: user.id, email: user.email, name: user.name, role: user.role });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Create or refresh the user record at sign-in. */
export async function upsertUser(input: { id: string; email: string; name: string; forceRole?: Role }): Promise<AppUser> {
  const store = await getStore();
  const existing = await store.get('users', input.id);
  const email = input.email.toLowerCase();
  if (existing) {
    await store.update('users', input.id, { lastLoginAt: nowIso(), name: existing.name || input.name });
    return { ...existing, lastLoginAt: nowIso() };
  }
  const all = await store.list('users');
  const invited = all.find((u) => u.email === email && u.id !== input.id);
  if (invited) {
    // An admin pre-provisioned this email from Admin → Users: adopt that role.
    const user: AppUser = { id: input.id, email, name: invited.name || input.name, role: invited.role, createdAt: invited.createdAt, lastLoginAt: nowIso() };
    await store.set('users', input.id, user);
    await store.remove('users', invited.id);
    return user;
  }
  const role: Role =
    input.forceRole ?? (config.bootstrapAdmins.includes(email) || (config.bootstrapAdmins.length === 0 && all.length === 0)
      ? 'admin'
      : 'viewer');
  const user: AppUser = { id: input.id, email, name: input.name || email.split('@')[0]!, role, createdAt: nowIso(), lastLoginAt: nowIso() };
  await store.set('users', input.id, user);
  return user;
}
