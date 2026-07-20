// AppEvent is the shared UI-level event type used across routes and components.
// All data is fetched from the backend API — there is no mock/generated data.

export type EventType = "training" | "workshop";
export type EventStatus = "upcoming" | "completed" | "draft";

export interface AppEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  organizer: string;
  organizerAvatar?: string;
  createdBy: string;
  date: string;       // ISO date string
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  durationMin: number;
  location: string;
  meetingLink: string;
  participants: string[];
  teamsInvited: string[];
  attachments: { name: string; size: string }[];
  status: EventStatus;
  invitedCount: number;
  assignmentIncluded?: boolean;
  organizerId?: number;
  seriesId?: string | null;
  isRecurringGroup?: boolean;
  recurrenceUntil?: string;
  occurrencesCount?: number;
}
