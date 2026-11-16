'use client';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, OAuthProvider, signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, type Auth } from 'firebase/auth';

let auth: Auth | undefined;
function clientAuth() {
  if (auth) return auth;
  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  auth = getAuth(app);
  return auth;
}

export async function signInMicrosoft() {
  const provider = new OAuthProvider('microsoft.com');
  const tenant = process.env.NEXT_PUBLIC_MS_TENANT;
  provider.setCustomParameters({ prompt: 'select_account', ...(tenant ? { tenant } : {}) });
  const cred = await signInWithPopup(clientAuth(), provider);
  return cred.user.getIdToken();
}

export async function signInPassword(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(clientAuth(), email, password);
  return cred.user.getIdToken();
}

export const resetPassword = (email: string) => sendPasswordResetEmail(clientAuth(), email);
export const signOutClient = () => clientAuth().signOut();
