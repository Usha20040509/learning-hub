import type {
  CalendarResponse,
  EventCreate,
  EventRead,
  HealthResponse,
  MySessionsResponse,
  PaginatedResponse,
  TeamRead,
  TrainingCatalogRead,
  EmployeeRead,
  DashboardSummary,
  DashboardLeaderboardResponse,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function buildQuery(params: Record<string, unknown | undefined>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!entries.length) {
    return "";
  }

  const searchParams = new URLSearchParams(
    entries.map(([key, value]) => [key, String(value)]),
  );

  return `?${searchParams.toString()}`;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

export function getEmployees(options: {
  page?: number;
  page_size?: number;
  search?: string;
  department?: string;
  is_active?: boolean;
} = {}) {
  return apiFetch<PaginatedResponse<EmployeeRead>>(
    `/employees${buildQuery({
      page: options.page,
      page_size: options.page_size,
      search: options.search,
      department: options.department,
      is_active: options.is_active,
    })}`,
  );
}

export function getTeams(options: { page?: number; page_size?: number; search?: string; is_active?: boolean } = {}) {
  return apiFetch<PaginatedResponse<TeamRead>>(
    `/teams${buildQuery({
      page: options.page,
      page_size: options.page_size,
      search: options.search,
      is_active: options.is_active,
    })}`,
  );
}

export function getTrainingCatalog(options: { page?: number; page_size?: number; search?: string; category?: string } = {}) {
  return apiFetch<PaginatedResponse<TrainingCatalogRead>>(
    `/training-catalog${buildQuery({
      page: options.page,
      page_size: options.page_size,
      search: options.search,
      category: options.category,
    })}`,
  );
}

export function getEvents(options: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  start_after?: string;
  end_before?: string;
} = {}) {
  return apiFetch<PaginatedResponse<EventRead>>(
    `/events${buildQuery({
      page: options.page,
      page_size: options.page_size,
      search: options.search,
      status: options.status,
      start_after: options.start_after,
      end_before: options.end_before,
    })}`,
  );
}

export function getEvent(eventId: number) {
  return apiFetch<EventRead>(`/events/${eventId}`);
}

export function getDashboardSummary(employee_id: number) {
  return apiFetch<DashboardSummary>(`/dashboard${buildQuery({ employee_id })}`);
}

export function getCalendarEvents(options: {
  start_date: string;
  end_date: string;
  view?: string;
  employee_id?: number;
}) {
  return apiFetch<CalendarResponse>(
    `/dashboard/calendar${buildQuery({
      start_date: options.start_date,
      end_date: options.end_date,
      view: options.view ?? "month",
      employee_id: options.employee_id,
    })}`,
  );
}

export function getMySessions(options: {
  employee_id: number;
  training?: string;
  workshop?: string;
  organizer?: string;
  date?: string;
  team?: string;
}) {
  return apiFetch<MySessionsResponse>(
    `/dashboard/my-sessions${buildQuery({
      employee_id: options.employee_id,
      training: options.training,
      workshop: options.workshop,
      organizer: options.organizer,
      date: options.date,
      team: options.team,
    })}`,
  );
}

export function getHealthStatus() {
  return apiFetch<HealthResponse>("/health");
}

export function createEvent(data: EventCreate) {
  return apiFetch<EventRead>("/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data: { email: string }) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteEvent(eventId: number) {
  return apiFetch<void>(`/events/${eventId}`, {
    method: "DELETE",
  });
}

export function getLeaderboard() {
  return apiFetch<DashboardLeaderboardResponse>("/dashboard/leaderboard");
}

export async function uploadEventResults(eventId: number, file: File): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/upload-results`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API request failed (${response.status}): ${text}`);
  }
  return (await response.json()) as { message: string };
}

export interface LoginResponse {
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
