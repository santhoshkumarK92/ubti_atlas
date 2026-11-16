// Edge-safe session helpers (used by middleware and server code).
import { SignJWT, jwtVerify } from 'jose';
import type { Role } from './types';

export const SESSION_COOKIE = 'atlas_session';
export const SESSION_DAYS = 7;

export interface SessionPayload {
  uid: string;
  email: string;
  name: string;
  role: Role;
}

const key = () =>
  new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me');

export async function signSession(p: SessionPayload) {
  return new SignJWT({ ...p })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function verifySession(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
