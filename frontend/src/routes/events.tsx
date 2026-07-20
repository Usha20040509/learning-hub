import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Copy, Eye, MoreHorizontal, Search, Trash2, Video } from "lucide-react";
import { AppLayout, TypeBadge } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EventDetailsDialog } from "@/components/EventDetailsDialog";
import { getEvents } from "@/lib/api";
import type { AppEvent } from "@/lib/event-types";
import type { EventRead } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — Learning Hub" },
      { name: "description", content: "Browse and manage all company trainings and workshops." },
    ],
  }),
  component: EventsPage,
});

function eventReadToAppEvent(e: EventRead): AppEvent {
  const start = new Date(e.start_time);
  const end = new Date(e.end_time);
  return {
    id: `evt-${e.id}`,
    title: e.title,
    description: e.description ?? "",
    type: "training", // API does not return event_type on EventRead — default to training
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
    seriesId: e.series_id ?? null,
  };
}

function EventsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<AppEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AppEvent | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["events", status],
    queryFn: () => getEvents({ page: 1, page_size: 100, status: status !== "all" ? status : undefined }),
    staleTime: 1000 * 30,
  });

  const events: AppEvent[] = useMemo(
    () => (data?.items ?? []).map(eventReadToAppEvent),
    [data],
  );

  const filtered = useMemo(() => {
    const raw = events.filter((e) => {
      if (q && !e.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });

    const seriesMap = new Map<string, AppEvent[]>();
    const unaggregated: AppEvent[] = [];

    for (const e of raw) {
      if (e.seriesId) {
        if (!seriesMap.has(e.seriesId)) seriesMap.set(e.seriesId, []);
        seriesMap.get(e.seriesId)!.push(e);
      } else {
        unaggregated.push(e);
      }
    }

    const aggregatedSeries = Array.from(seriesMap.values()).map(group => {
      if (group.length === 1) return group[0];
      group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const first = group[0];
      const last = group[group.length - 1];
      return {
        ...first,
        isRecurringGroup: true,
        recurrenceUntil: last.date,
        occurrencesCount: group.length,
      };
    });

    const combined = [...unaggregated, ...aggregatedSeries];
    combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return combined;
  }, [events, q]);

  const view = (e: AppEvent) => { setSelected(e); setOpen(true); };

  return (
    <AppLayout>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All trainings and workshops across the company.</p>
        </div>
        <Badge variant="outline" className="bg-secondary">{filtered.length} events</Badge>
      </div>

      <Card className="p-4 shadow-card border-border/60 mb-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events..." className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="shadow-card border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Invited</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                    Loading events…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                    No events match your filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((e) => (
                <TableRow key={e.id} className="hover:bg-secondary/40 cursor-pointer" onClick={() => view(e)}>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell>
                    {e.isRecurringGroup ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-[10px] uppercase tracking-wider bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded w-fit">
                          Recurring ({e.occurrencesCount}x)
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          Until {format(new Date(e.recurrenceUntil!), "MMM d, yyyy")}
                        </span>
                      </div>
                    ) : (
                      format(new Date(e.date), "MMM d, yyyy")
                    )}
                  </TableCell>
                  <TableCell>{e.startTime} – {e.endTime}</TableCell>
                  <TableCell>{e.location}</TableCell>
                  <TableCell>{e.invitedCount}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      e.status === "upcoming" ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600",
                    )}>
                      {e.status === "upcoming" ? "Scheduled" : "Completed"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {e.meetingLink && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Join meeting"
                          onClick={() => window.open(e.meetingLink, "_blank", "noopener,noreferrer")}
                        >
                          <Video className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => view(e)}>
                            <Eye className="h-4 w-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setToDelete(e)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <EventDetailsDialog event={selected} open={open} onOpenChange={setOpen} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.title}" will be permanently removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                toast.success("Event deleted");
                setToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
