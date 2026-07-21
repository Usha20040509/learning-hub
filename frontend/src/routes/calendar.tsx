import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventDetailsDialog } from "@/components/EventDetailsDialog";
import { getCalendarEvents, getEvent } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import type { AppEvent } from "@/lib/event-types";
import { format } from "date-fns";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Learning Hub" },
      { name: "description", content: "Month, week and day view of all trainings and workshops." },
    ],
  }),
  component: CalendarPage,
});

function eventReadToAppEvent(e: any): AppEvent {
  const start = new Date(e.start_time);
  const end = new Date(e.end_time);
  return {
    id: `evt-${e.id}`,
    title: e.title,
    description: e.description ?? "",
    type: "training",
    organizer: e.organizer_name ?? "—",
    organizerAvatar: undefined,
    createdBy: e.organizer_name ?? "—",
    date: start.toISOString(),
    startTime: format(start, "HH:mm"),
    endTime: format(end, "HH:mm"),
    durationMin: Math.max(30, Math.round((end.getTime() - start.getTime()) / 60000)),
    location: e.location ?? "Remote",
    meetingLink: e.meeting_link ?? "",
    participants: e.invited_employee_names ?? [],
    teamsInvited: e.invited_team_names ?? [],
    attachments: [],
    status: (e.status === "completed" ? "completed" : "upcoming") as AppEvent["status"],
    invitedCount: e.invited_employee_ids?.length ?? 0,
    assignmentIncluded: e.assignment_included,
    organizerId: e.organizer_id,
  };
}

function mapCalendarEventToAppEvent(event: any): AppEvent {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  return {
    id: `evt-${event.id}`,
    title: event.title,
    description: event.description ?? "",
    type: event.event_type === "workshop" ? "workshop" : "training",
    organizer: event.organizer_name ?? "Unknown",
    organizerAvatar: undefined,
    createdBy: event.organizer_name ?? "Unknown",
    date: start.toISOString(),
    startTime: `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}`,
    endTime: `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`,
    durationMin: Math.max(30, Math.round((end.getTime() - start.getTime()) / 60000)),
    location: event.location ?? "Remote",
    meetingLink: event.meeting_link ?? "",
    participants: [],
    teamsInvited: [],
    attachments: [],
    status: event.status ?? "upcoming",
    invitedCount: 0,
    assignmentIncluded: event.assignment_included,
    organizerId: event.organizer_id,
  };
}

function CalendarPage() {
  const [selected, setSelected] = useState<AppEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"my" | "team">("my");
  const ref = useRef<FullCalendar>(null);

  const currentUser = getCurrentUser();
  const employeeId = currentUser?.id;

  const startDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }, []);
  const endDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  }, []);

  // All events for the calendar (no employee filter — shows everything)
  const { data: allData } = useQuery({
    queryKey: ["calendarEvents", startDate, endDate],
    queryFn: () => getCalendarEvents({ start_date: startDate, end_date: endDate, view: "month" }),
  });

  // User's own sessions to know which events to highlight
  const { data: myData } = useQuery({
    queryKey: ["calendarMyEvents", startDate, endDate, employeeId],
    queryFn: () => getCalendarEvents({ start_date: startDate, end_date: endDate, view: "month", employee_id: employeeId }),
    enabled: Boolean(employeeId),
  });

  const myEventIds = useMemo(
    () => new Set((myData?.events ?? []).map((e) => e.id)),
    [myData],
  );

  const fcEvents = useMemo(
    () => {
      const source = viewMode === "my" ? myData?.events : allData?.events;
      return (source ?? []).map((event) => {
        const isMine = myEventIds.has(event.id);
        // Color logic:
        //   user's own event → solid primary (red)
        //   other events → muted/faded version
        const bg = isMine ? "#c8102e" : "#fca5a5";
        const border = isMine ? "#9b0f24" : "#f87171";

        return {
          id: String(event.id),
          title: event.title,
          start: event.start_time,
          end: event.end_time,
          backgroundColor: bg,
          borderColor: border,
          textColor: isMine ? "#ffffff" : "#374151",
          extendedProps: { event, isMine },
        };
      });
    },
    [allData, myData, myEventIds, viewMode],
  );

  const handleClick = async (info: EventClickArg) => {
    const calendarEvent = info.event.extendedProps.event as any;
    try {
      const fullEvent = await getEvent(calendarEvent.id);
      setSelected(eventReadToAppEvent(fullEvent));
    } catch (err) {
      setSelected(mapCalendarEventToAppEvent(calendarEvent));
    }
    setOpen(true);
  };

  return (
    <AppLayout>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View training sessions.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Tabs defaultValue="my" value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="my">My View</TabsTrigger>
              <TabsTrigger value="team">Team View</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#c8102e" }} />
              My training
            </div>
            {viewMode === "team" && (
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                Other training
              </div>
            )}
          </div>
        </div>
      </div>

      <Card className="p-4 md:p-6 shadow-card border-border/60">
        <FullCalendar
          ref={ref}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={fcEvents}
          eventClick={handleClick}
          height="auto"
          dayMaxEvents={3}
          firstDay={1}
          nowIndicator
        />
      </Card>

      <EventDetailsDialog event={selected} open={open} onOpenChange={setOpen} />
    </AppLayout>
  );
}
