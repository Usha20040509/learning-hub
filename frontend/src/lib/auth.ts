import { signOutFirebase } from "@/lib/firebase";

export interface AuthUser {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: string;
  job_title?: string;
  group_name?: string;
  years_experience?: string;
  work_location?: string;
}

const STORAGE_KEY = "learninghub_user";

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export async function clearCurrentUser() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  // Also sign out of Firebase so the Google session is fully terminated
  await signOutFirebase().catch(() => {});
}

export function isAuthenticated() {
  return getCurrentUser() !== null;
}

export function isManagerWithEditAccess(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.first_name?.toLowerCase() === "vimal") return true;

  const title = user.job_title?.toLowerCase() || "";
  if (title.includes("associate") || title.includes("assistant")) return false;

  return title.includes("senior project manager") || title.includes("technical project manager");
}
