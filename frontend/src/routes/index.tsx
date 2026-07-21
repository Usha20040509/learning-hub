import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, isSameMonth } from "date-fns";
import {
  CalendarClock,
  CalendarDays,
  GraduationCap,
  Sparkles,
  Bot,
  Wand2,
  Video,
  ArrowRight,
  Clock,
  User,
  Award,
  CheckCircle2,
  FileText,
  Users2,
  TrendingUp,
} from "lucide-react";
import { AppLayout, TypeBadge } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "@/components/EventCard";
import { EventDetailsDialog } from "@/components/EventDetailsDialog";
import { getDashboardSummary, getEvent, getLeaderboard, getEvents } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import type { AppEvent } from "@/lib/event-types";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Learning Hub" },
      { name: "description", content: "Your trainings, workshops, and upcoming sessions at a glance." },
    ],
  }),
  component: DashboardPage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function mapSessionToAppEvent(session: any): AppEvent {
  const start = session.start_time ? new Date(session.start_time) : new Date();
  const end = session.end_time ? new Date(session.end_time) : new Date(start.getTime() + 60 * 60000);
  return {
    id: `evt-${session.id}`,
    title: session.title ?? "Untitled session",
    description: session.description ?? "",
    type: session.event_type === "workshop" ? "workshop" : "training",
    organizer: session.organizer_name ?? "Unknown",
    organizerAvatar: undefined,
    createdBy: session.organizer_name ?? "Unknown",
    date: start.toISOString(),
    startTime: format(start, "HH:mm"),
    endTime: format(end, "HH:mm"),
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
  };
}



function getEmployeeColor(index: number): string {
  const colors = ["bg-red-600", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-indigo-500", "bg-teal-500"];
  return colors[index % colors.length];
}

function DashboardPage() {
  const [selected, setSelected] = useState<AppEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  const currentUser = getCurrentUser();
  const employeeId = currentUser?.id ?? 0;

  const { data: summaryData } = useQuery({
    queryKey: ["dashboardSummary", employeeId],
    queryFn: () => getDashboardSummary(employeeId),
    enabled: employeeId > 0,
    staleTime: 1000 * 60,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ["dashboardLeaderboard"],
    queryFn: () => getLeaderboard(),
    staleTime: 1000 * 60,
  });

  const { data: allEventsData } = useQuery({
    queryKey: ["allUpcomingEvents"],
    queryFn: () => getEvents({ page: 1, page_size: 10, start_after: new Date().toISOString() }),
    staleTime: 1000 * 60,
  });

  const upcoming = summaryData?.upcoming_sessions ?? [];
  const today = summaryData?.todays_sessions ?? [];
  const thisMonth = useMemo(
    () => upcoming.filter((e: any) => isSameMonth(new Date(e.start_time), new Date())),
    [upcoming],
  );
  const workshops = useMemo(
    () => upcoming.filter((e: any) => e.event_type === "workshop"),
    [upcoming],
  );
  const next = summaryData?.next_session as any | null;
  const upcomingEvents = useMemo(() => upcoming.map(mapSessionToAppEvent), [upcoming]);

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

  const allUpcoming = useMemo(() => {
    return (allEventsData?.items ?? [])
      .filter((e: any) => new Date(e.start_time) >= new Date())
      .map(eventReadToAppEvent);
  }, [allEventsData?.items]);

  const open = async (event: AppEvent) => {
    try {
      const numericId = Number(event.id.replace("evt-", ""));
      const fullEvent = await getEvent(numericId);
      setSelected(eventReadToAppEvent(fullEvent));
    } catch (err) {
      setSelected(event);
    }
    setDialogOpen(true);
  };

  return (
    <AppLayout>
      {/* Hero banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-6 md:p-8 shadow-elevated mb-6 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-20 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm font-medium opacity-90">
              {greeting()}{currentUser ? `, ${currentUser.first_name}` : ""}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mt-1">Learning Hub</h1>
            <div className="mt-1 text-sm opacity-90">
              {currentUser?.job_title ?? "Your training dashboard"}
              {currentUser?.group_name ? ` · ${currentUser.group_name}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" className="bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur">
              <Link to="/calendar"><CalendarDays className="h-4 w-4 mr-1.5" />Open calendar</Link>
            </Button>
            <Button asChild className="bg-white text-primary hover:bg-white/90">
              <Link to="/create-event">Create event</Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="my-dashboard" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="my-dashboard">My Dashboard</TabsTrigger>
          <TabsTrigger value="team-leaderboard">Team Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="my-dashboard" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Next session card */}
              <Card className="p-6 shadow-card border-border/60">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Next Session</div>
                    <div className="text-lg font-semibold mt-0.5">Coming up for you</div>
                  </div>
                  {next && <TypeBadge type={next.event_type === "workshop" ? "workshop" : "training"} />}
                </div>
                {next ? (
                  <div className="flex flex-col md:flex-row md:items-center gap-5">
                    {/* Left part: Date Badge */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-20 h-24 rounded-2xl bg-red-50 text-red-700 border border-red-100 p-2 shadow-sm font-semibold">
                      <div className="text-xs uppercase tracking-wider text-red-500">{format(new Date(next.start_time), "MMM")}</div>
                      <div className="text-3xl font-extrabold mt-0.5 leading-none">{format(new Date(next.start_time), "d")}</div>
                      <div className="text-xs mt-1 text-red-500">{format(new Date(next.start_time), "EEE")}</div>
                    </div>

                    {/* Middle part: Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-lg text-foreground leading-tight truncate">{next.title}</h3>
                        {next.assignment_included && <Badge variant="outline" className="text-[10px] bg-red-50/50 text-red-700 border-red-200">Assignment Included</Badge>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                          <span>{format(new Date(next.start_time), "h:mm a")} – {format(new Date(next.end_time), "h:mm a")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground/70" />
                          <span>{next.organizer_name || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:col-span-2">
                          <Video className="h-3.5 w-3.5 text-muted-foreground/70" />
                          <span className="truncate">{next.location || "Microsoft Teams Meeting"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right part: Action buttons */}
                    <div className="flex gap-2.5 mt-4 md:mt-0">
                      <Button variant="outline" onClick={() => open(mapSessionToAppEvent(next))}>Details</Button>
                      {next.meeting_link && (
                        <Button
                          className="bg-[#c8102e] hover:bg-[#a60b24] text-white gap-1.5"
                          onClick={() => window.open(next.meeting_link, "_blank", "noopener,noreferrer")}
                        >
                          <Video className="h-4 w-4" /> Join Meeting
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-2">
                    {employeeId > 0 ? "No upcoming sessions scheduled for you." : "Sign in to see your sessions."}
                  </div>
                )}
              </Card>

              {/* Assignments card */}
              <Card className="p-6 shadow-card border-border/60">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm tracking-wide text-foreground">Assignments</h3>
                  <button className="text-xs font-semibold text-primary hover:underline" onClick={() => toast.info("No more assignments pending")}>View all</button>
                </div>
                <div className="space-y-3">
                  {!summaryData?.assignments || summaryData.assignments.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center">No pending assignments.</div>
                  ) : (
                    summaryData.assignments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors font-medium">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600 border border-red-100">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">{a.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{a.due}</div>
                          </div>
                        </div>
                        <Badge className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200/50" variant="outline">{a.status}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Upcoming card */}
              <Card className="p-6 shadow-card border-border/60">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm tracking-wide text-foreground">Upcoming Sessions</h3>
                  <Link to="/my-sessions" className="text-xs font-semibold text-primary hover:underline">View all</Link>
                </div>
                <div className="space-y-4">
                  {upcomingEvents.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-6 text-center">No upcoming sessions.</div>
                  ) : (
                    upcomingEvents.slice(0, 3).map((event) => {
                      const dt = new Date(event.date);
                      return (
                        <div key={event.id} className="flex gap-3 items-center group cursor-pointer" onClick={() => open(event)}>
                          <div className="flex flex-col items-center justify-center shrink-0 w-12 h-14 rounded-xl bg-red-50/70 text-red-700 border border-red-100/50 p-1 text-[10px] font-semibold">
                            <div className="uppercase text-[8px] text-red-500 leading-none">{format(dt, "MMM")}</div>
                            <div className="text-lg font-bold mt-0.5 leading-none">{format(dt, "d")}</div>
                            <div className="uppercase text-[8px] text-red-500 leading-none mt-0.5">{format(dt, "EEE")}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm leading-tight text-foreground truncate group-hover:text-primary transition-colors">{event.title}</div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>{event.startTime} – {event.endTime}</span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <TypeBadge type={event.type} className="text-[10px] px-1.5 py-0" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* Recent Activity card */}
              <Card className="p-6 shadow-card border-border/60">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm tracking-wide text-foreground">Recent Activity</h3>
                  <button className="text-xs font-semibold text-primary hover:underline" onClick={() => toast.info("All activities are loaded")}>View all activity</button>
                </div>
                <div className="space-y-3.5">
                  {!summaryData?.recent_activities || summaryData.recent_activities.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-4 text-center">No recent activity.</div>
                  ) : (
                    summaryData.recent_activities.map((act) => (
                      <div key={act.id} className="flex gap-2.5 items-start">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-foreground">{act.text}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{act.date}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team-leaderboard" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table */}
            <div className="lg:col-span-2">
              <Card className="p-6 shadow-card border-border/60">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm tracking-wide text-foreground">Leaderboard</h3>
                  <button
                    className="text-xs font-semibold text-primary hover:underline"
                    onClick={() => setLeaderboardOpen(true)}
                  >View all employees</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Employee</th>
                        <th className="py-2.5 px-3 text-center">Attendance</th>
                        <th className="py-2.5 px-3 text-center">Sessions Attended</th>
                        <th className="py-2.5 px-3 text-center">Assignments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(leaderboardData?.leaderboard ?? []).slice(0, 10).map((row) => (
                        <tr key={row.employee} className="border-b border-border/40 hover:bg-secondary/15 transition-colors font-medium">
                          <td className="py-3 px-3 text-foreground">{row.employee}</td>
                          <td className="py-3 px-3 text-center">{row.attendance}</td>
                          <td className="py-3 px-3 text-center font-bold text-primary">{row.sessions_attended}</td>
                          <td className="py-3 px-3 text-center">{row.assignments}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="space-y-6">
              {/* Attendance Overview Card */}
              <Card className="p-6 shadow-card border-border/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm tracking-wide text-foreground">Attendance Overview</h3>
                  <span className="text-xs text-muted-foreground">This Month</span>
                </div>
                <div className="space-y-3.5">
                  {(leaderboardData?.leaderboard ?? []).slice(0, 5).map((row, idx) => {
                    const percentage = parseInt(row.attendance.replace("%", ""), 10) || 0;
                    const color = getEmployeeColor(idx);
                    return (
                      <div key={row.employee} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-muted-foreground truncate max-w-[170px]">{row.employee}</span>
                          <span className="text-foreground">{row.attendance}</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-secondary/85 overflow-hidden border border-border/10">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", color)}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Assignments Submitted Card */}
              <Card className="p-6 shadow-card border-border/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm tracking-wide text-foreground">Assignments Submitted</h3>
                  <span className="text-xs text-muted-foreground">This Month</span>
                </div>
                <div className="space-y-3.5">
                  {(leaderboardData?.leaderboard ?? []).slice(0, 5).map((row, idx) => {
                    const maxAssignments = Math.max(...(leaderboardData?.leaderboard ?? []).map(r => r.assignments), 50);
                    const barPercentage = Math.round((row.assignments / maxAssignments) * 100) || 0;
                    const color = getEmployeeColor(idx);
                    return (
                      <div key={row.employee} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-muted-foreground truncate max-w-[170px]">{row.employee}</span>
                          <span className="text-foreground">{row.assignments}</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-secondary/85 overflow-hidden border border-border/10">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", color)}
                            style={{ width: `${barPercentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>

          {/* All Company Upcoming events */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">All Upcoming Company Sessions</h2>
              <span className="text-xs text-muted-foreground">Showing sessions for all employees</span>
            </div>
            {allUpcoming.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                No upcoming company sessions scheduled.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allUpcoming.slice(0, 4).map((event) => (
                  <EventCard key={event.id} event={event} onView={open} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <EventDetailsDialog event={selected} open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Full leaderboard dialog */}
      {leaderboardOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setLeaderboardOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative z-50 w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl bg-background shadow-2xl border border-border/60"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
              <div>
                <h2 className="font-bold text-base text-foreground">Full Leaderboard</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {leaderboardData?.leaderboard.length ?? 0} employees ranked by sessions attended
                </p>
              </div>
              <button
                onClick={() => setLeaderboardOpen(false)}
                className="rounded-full h-8 w-8 flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors text-lg leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Scrollable table */}
            <div className="overflow-y-auto flex-1 px-6 py-2">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="border-b border-border/60 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-2 w-8 text-center">#</th>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3 text-center">Attendance</th>
                    <th className="py-2.5 px-3 text-center">Sessions Attended</th>
                    <th className="py-2.5 px-3 text-center">Assignments</th>
                  </tr>
                </thead>
                <tbody>
                  {(leaderboardData?.leaderboard ?? []).map((row, idx) => (
                    <tr
                      key={row.employee}
                      className="border-b border-border/40 hover:bg-secondary/15 transition-colors font-medium"
                    >
                      <td className="py-3 px-2 text-center text-xs text-muted-foreground font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 text-foreground">{row.employee}</td>
                      <td className="py-3 px-3 text-center">{row.attendance}</td>
                      <td className="py-3 px-3 text-center font-bold text-primary">{row.sessions_attended}</td>
                      <td className="py-3 px-3 text-center">{row.assignments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

const accentMap = {
  red: "bg-primary/10 text-primary",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
} as const;

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof CalendarClock; label: string; value: number; accent: keyof typeof accentMap }) {
  return (
    <Card className="p-5 shadow-card border-border/60 hover-lift">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground font-medium">{label}</div>
          <div className="text-3xl font-bold mt-1">{value}</div>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function ComingSoonCard({ icon: Icon, title, description }: { icon: typeof Bot; title: string; description: string }) {
  return (
    <Card className="p-5 shadow-card border-dashed border-border/80 bg-secondary/40">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold">{title}</div>
            <Badge variant="outline" className="text-[10px] gap-1 bg-primary/5 text-primary border-primary/20">
              <Sparkles className="h-2.5 w-2.5" />Coming soon
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">{description}</div>
        </div>
      </div>
    </Card>
  );
}
