export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface EmployeeRead {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: string | null;
  job_title?: string | null;
  manager_id?: number | null;
  is_active: boolean;
}

export interface TeamRead {
  id: number;
  team_code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  member_count: number;
}

export interface TrainingCatalogRead {
  id: number;
  code: string;
  title: string;
  description?: string | null;
  category?: string | null;
  duration_hours?: number | null;
}

export interface EventRead {
  id: number;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  status: string;
  training_catalog_id?: number | null;
  organizer_id: number;
  meeting_link?: string | null;
  assignment_included?: boolean;
  invited_employee_ids: number[];
  invited_team_ids: number[];
  organizer_name?: string | null;
  invited_employee_names?: string[];
  invited_team_names?: string[];
  is_recurring?: boolean;
  recurrence_until?: string | null;
  /** Days of week to repeat on: 0=Mon … 6=Sun. Empty = every day. */
  recurrence_days?: number[];
  series_id?: string | null;
}

export interface EventCreate {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  status?: string;
  training_catalog_id?: number | null;
  organizer_id: number;
  meeting_link?: string | null;    // optional — no link = no Join button
  assignment_included?: boolean;
  invited_employee_ids: number[];
  invited_team_ids: number[];
  is_recurring?: boolean;
  recurrence_until?: string | null;
  /** Days of week to repeat on: 0=Mon … 6=Sun. Empty = every day. */
  recurrence_days?: number[];
}

export interface DashboardSummary {
  upcoming_sessions: Array<Record<string, unknown>>;
  todays_sessions: Array<Record<string, unknown>>;
  next_session: Record<string, unknown> | null;
  recent_events: Array<Record<string, unknown>>;
  assignments?: { id: number; title: string; due: string; status: string }[];
  recent_activities?: { id: number; text: string; date: string }[];
}

export interface CalendarEvent {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  location?: string | null;
  status: string;
  event_type: string;
  organizer_name?: string | null;
  meeting_link?: string | null;
  assignment_included?: boolean;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  view: string;
  start_date: string;
  end_date: string;
}

export interface MySessionItem {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  event_type: string;
  organizer_name?: string | null;
  location?: string | null;
  meeting_link?: string | null;
  assignment_included?: boolean;
}

export interface MySessionsResponse {
  todays_sessions: MySessionItem[];
  upcoming_sessions: MySessionItem[];
  completed_sessions: MySessionItem[];
}

export interface LeaderboardItem {
  employee: string;
  attendance: string;
  sessions_attended: number;
  assignments: number;
}

export interface DashboardLeaderboardResponse {
  leaderboard: LeaderboardItem[];
}

export interface HealthResponse {
  status: string;
  service: string;
}
