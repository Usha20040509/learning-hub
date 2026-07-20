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

export function clearCurrentUser() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function isAuthenticated() {
  return getCurrentUser() !== null;
}
