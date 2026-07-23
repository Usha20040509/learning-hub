/**
 * Firebase client-side initialisation.
 * All values come from Vite env variables so they are safe to commit.
 */
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Guard against HMR double-initialisation
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firebaseAuth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
// Restrict sign-in to the company domain
googleProvider.setCustomParameters({ hd: "maqsoftware.com" });

/**
 * Opens a Google sign-in popup and returns the Firebase ID token
 * that must be sent to the backend for verification.
 */
export async function signInWithGoogle(): Promise<{ idToken: string; user: User }> {
  const result = await signInWithPopup(firebaseAuth, googleProvider);
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}

export async function signOutFirebase(): Promise<void> {
  await firebaseSignOut(firebaseAuth);
}
