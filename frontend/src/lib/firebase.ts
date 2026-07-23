/**
 * Firebase client-side initialisation.
 * All values come from Vite env variables so they are safe to commit.
 */
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
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

// LocalStorage key used to remember the email while the user checks their inbox
const EMAIL_STORAGE_KEY = "learninghub_signin_email";

/**
 * Sends a Firebase magic link to the given email address.
 * Saves the email to localStorage so it can be retrieved when the user
 * lands back on this page after clicking the link.
 */
export async function sendMagicLink(email: string): Promise<void> {
  const actionCodeSettings = {
    // After the user clicks the link they will be redirected back here
    url: window.location.origin + "/login",
    handleCodeInApp: true,
  };

  await sendSignInLinkToEmail(firebaseAuth, email, actionCodeSettings);
  localStorage.setItem(EMAIL_STORAGE_KEY, email);
}

/**
 * Returns true if the current URL contains a Firebase email sign-in link.
 */
export function isMagicLinkUrl(): boolean {
  return isSignInWithEmailLink(firebaseAuth, window.location.href);
}

/**
 * Completes the magic-link sign-in flow.
 * Call this when `isMagicLinkUrl()` is true.
 * Returns the Firebase ID token to send to the backend.
 */
export async function completeMagicLinkSignIn(): Promise<{ idToken: string; user: User }> {
  // Retrieve the email saved before the user left to check their inbox
  let email = localStorage.getItem(EMAIL_STORAGE_KEY) ?? "";

  if (!email) {
    // Fallback: prompt the user (e.g. they opened the link in a different browser)
    email = window.prompt("Please enter your email to confirm sign-in:") ?? "";
  }

  const result = await signInWithEmailLink(firebaseAuth, email, window.location.href);
  localStorage.removeItem(EMAIL_STORAGE_KEY);

  // Clean the OOB code from the URL so refreshing doesn't re-trigger sign-in
  window.history.replaceState(null, "", window.location.pathname);

  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}

export async function signOutFirebase(): Promise<void> {
  await firebaseSignOut(firebaseAuth);
}
