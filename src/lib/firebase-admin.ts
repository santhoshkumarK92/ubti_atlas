import 'server-only';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { config } from './config';

let app: App | undefined;

export function adminApp(): App {
  if (app) return app;
  app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
      storageBucket: config.firebase.bucket || `${config.firebase.projectId}.firebasestorage.app`,
    });
  return app;
}

let db: Firestore | undefined;
export function adminDb(): Firestore {
  if (db) return db;
  db = getFirestore(adminApp());
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Dev hot-reload re-runs this module against an already-configured Firestore instance;
    // settings() may only be called once, and the earlier call already applied them.
  }
  return db;
}

export const adminBucket = () => getStorage(adminApp()).bucket();
export const adminAuth = () => getAuth(adminApp());
