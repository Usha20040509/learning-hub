import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarX2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EventCard } from "@/components/EventCard";
import { EventDetailsDialog } from "@/components/EventDetailsDialog";
import { getMySessions, getEvent } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import type { AppEvent } from "@/lib/event-types";
import { format } from "date-fns";

export const Route = createFileRoute("/my-sessions")({
  head: () => ({
    meta: [
      { title: "My Sessions — Learning Hub" },
      { name: "description", content: "Your upcoming, today's, and completed learning sessions." },
    ],
  }),
  component: MySessionsPage,
});

function mapSessionToAppEvent(session: any): AppEvent {
  const start = new Date(session.start_time);
  const end = new Date(session.end_time);
  return {
    id: `evt-${session.id}`,
    title: session.title,
    description: session.description ?? "",
    type: session.event_type === "workshop" ? "workshop" : "training",
    organizer: session.organizer_name ?? "Unknown",
    organizerAvatar: undefined,
    createdBy: session.organizer_name ?? "Unknown",
    date: start.toISOString(),
    startTime: `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}`,
    endTime: `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`,
    durationMin: Math.max(30, Math.round((end.getTime() - start.getTime()) / 60000)),
    location: session.location ?? "Remote",
    meetingLink: session.meeting_link ?? "",
    participants: [],
    teamsInvited: [],
    attachments: [],
    status: session.status ?? "upcoming",
    invitedCount: 0,
    assignmentIncluded: session.assignment_included,
    organizerId: session.organizer_id,
    ownerId: session.owner_id,
  };
}

function MySessionsPage() {
  const [selected, setSelected] = useState<AppEvent | null>(null);
  const [open, setOpen] = useState(false);

  const currentUser = getCurrentUser();
  const employeeId = currentUser?.id ?? 0;

  const { data } = useQuery({
    queryKey: ["mySessions", employeeId],
    queryFn: () => getMySessions({ employee_id: employeeId }),
    enabled: employeeId > 0,
    staleTime: 1000 * 60,
  });

  const upcoming = useMemo(
    () => (data?.upcoming_sessions ?? []).map(mapSessionToAppEvent),
    [data?.upcoming_sessions],
  );
  const today = useMemo(
    () => (data?.todays_sessions ?? []).map(mapSessionToAppEvent),
    [data?.todays_sessions],
  );
  const completed = useMemo(
    () => (data?.completed_sessions ?? []).map(mapSessionToAppEvent),
    [data?.completed_sessions],
  );

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
      ownerId: e.owner_id,
    };
  }

  const view = async (event: AppEvent) => {
    try {
      const numericId = Number(event.id.replace("evt-", ""));
      const fullEvent = await getEvent(numericId);
      setSelected(eventReadToAppEvent(fullEvent));
    } catch (err) {
      setSelected(event);
    }
    setOpen(true);
  };

  return (
    <AppLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">My Sessions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Trainings organized by you.</p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming <span className="ml-1.5 text-xs text-muted-foreground">{upcoming.length}</span></TabsTrigger>
          <TabsTrigger value="today">Today <span className="ml-1.5 text-xs text-muted-foreground">{today.length}</span></TabsTrigger>
          <TabsTrigger value="completed">Completed <span className="ml-1.5 text-xs text-muted-foreground">{completed.length}</span></TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4"><Grid events={upcoming} onView={view} /></TabsContent>
        <TabsContent value="today" className="mt-4"><Grid events={today} onView={view} /></TabsContent>
        <TabsContent value="completed" className="mt-4"><Grid events={completed} onView={view} /></TabsContent>
      </Tabs>

      <EventDetailsDialog event={selected} open={open} onOpenChange={setOpen} />
    </AppLayout>
  );
}

function Grid({ events, onView }: { events: AppEvent[]; onView: (e: AppEvent) => void }) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground mb-3">
          <CalendarX2 className="h-6 w-6" />
        </div>
        <div className="font-semibold">Nothing here yet</div>
        <div className="text-sm text-muted-foreground mt-1">Sessions will appear as they get scheduled.</div>
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {events.map((e) => <EventCard key={e.id} event={e} onView={onView} />)}
    </div>
  );
}
