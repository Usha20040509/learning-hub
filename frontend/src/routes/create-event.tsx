import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { Paperclip, X, Check, ChevronsUpDown, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createEvent, getEmployees, getTeams } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import type { EmployeeRead, TeamRead } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create-event")({
  head: () => ({
    meta: [
      { title: "Create Event — Learning Hub" },
      { name: "description", content: "Schedule a new training or workshop." },
    ],
  }),
  component: CreateEventPage,
});

function EmployeeSelector({ employees, loading, selectedIds, onToggle }: {
  employees: EmployeeRead[];
  loading: boolean;
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  const [q, setQ] = useState("");
  const list = employees.filter((emp) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (`${emp.first_name} ${emp.last_name}`.toLowerCase().includes(s) || emp.email.toLowerCase().includes(s));
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Filter employees..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>
      <div className="space-y-1 max-h-60 overflow-y-auto p-1">
        {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
        {!loading && list.length === 0 && <div className="text-sm text-muted-foreground">No employees found.</div>}
        {!loading && list.map((emp) => (
          <label key={emp.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-secondary/20 rounded-md">
            <input type="checkbox" checked={selectedIds.includes(emp.id)} onChange={() => onToggle(emp.id)} className="rounded border-border text-primary focus:ring-primary" />
            <div className="text-sm">{emp.first_name} {emp.last_name} — <span className="text-muted-foreground text-xs">{emp.email}</span></div>
          </label>
        ))}
      </div>
    </div>
  );
}

function CreateEventPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // form state
  const [type, setType] = useState("training");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignmentIncluded, setAssignmentIncluded] = useState(false);
  const [organizerId, setOrganizerId] = useState<string>(
    currentUser ? String(currentUser.id) : ""
  );
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [inviteType, setInviteType] = useState("individual");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [attachments, setAttachments] = useState<{ name: string; size: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceUntil, setRecurrenceUntil] = useState("");
  // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [clashWarning, setClashWarning] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toggleRecurrenceDay = (day: number) =>
    setRecurrenceDays((cur) =>
      cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day]
    );

  const { data: employeeData, isLoading: empLoading } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () => getEmployees({ page: 1, page_size: 500 }),
    staleTime: 1000 * 60 * 5,
  });
  const employees: EmployeeRead[] = useMemo(() => {
    const items = employeeData?.items ?? [];
    return [...items].sort((a, b) => a.first_name.localeCompare(b.first_name) || a.last_name.localeCompare(b.last_name));
  }, [employeeData?.items]);

  const { data: teamData } = useQuery({
    queryKey: ["teams", "all"],
    queryFn: () => getTeams({ page: 1, page_size: 100 }),
    staleTime: 1000 * 60 * 5,
  });
  const teams: TeamRead[] = teamData?.items ?? [];

  // organizer search state
  const [organizerQuery, setOrganizerQuery] = useState("");
  const filteredEmployees = employees.filter((emp) => {
    const s = organizerQuery.trim().toLowerCase();
    if (!s) return true;
    return (`${emp.first_name} ${emp.last_name}`.toLowerCase().includes(s) || emp.email.toLowerCase().includes(s));
  });

  const reset = () => {
    setType("training"); setTitle(""); setDescription("");
    setAssignmentIncluded(false);
    setOrganizerId(currentUser ? String(currentUser.id) : "");
    setDate(""); setStart(""); setEnd(""); setLocation(""); setMeetingLink("");
    setInviteType("individual"); setSelectedEmployeeIds([]); setSelectedTeamIds([]);
    setAttachments([]);
    setIsRecurring(false);
    setRecurrenceUntil("");
    setRecurrenceDays([]);
    toast.info("Form reset");
  };

  const handlePreSubmit = () => {
    if (!title.trim()) { toast.error("Title is required."); return; }
    if (!organizerId) { toast.error("Please select an organizer."); return; }
    if (!date) { toast.error("Please select a date."); return; }
    if (!start || !end) { toast.error("Please set start and end times."); return; }
    if (start >= end) { toast.error("End time must be after start time."); return; }
    if (isRecurring && !recurrenceUntil) { toast.error("Please select repeat until date."); return; }
    if (isRecurring && recurrenceUntil && recurrenceUntil < date) {
      toast.error("Repeat until date must be on or after the event date.");
      return;
    }
    const invitedEmpIds = inviteType !== "team" ? selectedEmployeeIds : [];
    const invitedTeamIds = inviteType !== "individual" ? selectedTeamIds : [];

    if (inviteType === "individual" && invitedEmpIds.length === 0) {
      toast.error("Please select at least one employee to invite.");
      return;
    }
    if (inviteType === "team" && invitedTeamIds.length === 0) {
      toast.error("Please select at least one team.");
      return;
    }
    if (inviteType === "both" && invitedEmpIds.length === 0 && invitedTeamIds.length === 0) {
      toast.error("Please select at least one employee or team.");
      return;
    }
    setShowConfirmation(true);
  };

  const submit = async (draft: boolean, ignoreClashes: boolean = false) => {
    if (draft) { toast.success("Draft saved", { description: title || "Untitled" }); return; }
    const invitedEmpIds = inviteType !== "team" ? selectedEmployeeIds : [];
    const invitedTeamIds = inviteType !== "individual" ? selectedTeamIds : [];

    setSubmitting(true);
    try {
      await createEvent({
        title: title.trim(),
        description: description.trim() || null,
        start_time: `${date}T${start}:00`,
        end_time: `${date}T${end}:00`,
        location: location.trim() || null,
        status: "scheduled",
        training_catalog_id: null,
        organizer_id: Number(organizerId),
        meeting_link: meetingLink.trim() || null,
        assignment_included: assignmentIncluded,
        invited_employee_ids: invitedEmpIds,
        invited_team_ids: invitedTeamIds,
        is_recurring: isRecurring,
        recurrence_until: isRecurring && recurrenceUntil ? `${recurrenceUntil}T23:59:59` : null,
        recurrence_days: isRecurring ? recurrenceDays : [],
        ignore_clashes: ignoreClashes,
      });
      toast.success("Event created!", { description: title });
      navigate({ to: "/events" });
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("409")) {
        try {
          const jsonStr = msg.split("409): ")[1];
          const data = JSON.parse(jsonStr);
          setClashWarning(data.detail || "Time overlap detected.");
        } catch {
          setClashWarning("Time overlap detected with existing event.");
        }
      } else if (msg.includes("422")) toast.error("Invalid data — check times and organizer.");
      else if (msg.includes("404")) toast.error("Organizer or participant not found in the system.");
      else toast.error("Failed to create event. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEmployee = (id: number) =>
    setSelectedEmployeeIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  const toggleTeam = (id: number) =>
    setSelectedTeamIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);

  const organizerName = (() => {
    const emp = employees.find((e) => String(e.id) === organizerId);
    return emp ? `${emp.first_name} ${emp.last_name}` : "";
  })();

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create Event</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Schedule a training or workshop and invite participants.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Event Details Card */}
          <Card className="p-6 shadow-card border-border/60 space-y-5">
            <div>
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Advanced TypeScript Patterns" className="mt-1.5" />
            </div>

            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" rows={3} value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will attendees learn or do?" className="mt-1.5 resize-none" />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                id="assignmentIncluded"
                type="checkbox"
                checked={assignmentIncluded}
                onChange={(e) => setAssignmentIncluded(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <Label htmlFor="assignmentIncluded" className="text-sm font-semibold cursor-pointer">Assignment Included?</Label>
            </div>
          </Card>

          {/* Invite Participants Card */}
          <Card className="p-6 shadow-card border-border/60">
            <div>
              <Label>Invite Type</Label>
              <RadioGroup value={inviteType} onValueChange={setInviteType} className="mt-2 space-y-2">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="individual" /> Individual
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="team" /> Team
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="both" /> Both
                  </label>
                </div>
              </RadioGroup>
            </div>

            {inviteType !== "team" && (
              <div className="mt-4">
                <Label>Employees</Label>
                <div className="mt-2">
                  <EmployeeSelector
                    employees={employees}
                    loading={empLoading}
                    selectedIds={selectedEmployeeIds}
                    onToggle={(id) => {
                      if (selectedEmployeeIds.includes(id)) setSelectedEmployeeIds((cur) => cur.filter((x) => x !== id));
                      else setSelectedEmployeeIds((cur) => [...cur, id]);
                    }}
                  />
                </div>
              </div>
            )}

            {inviteType !== "individual" && (
              <div className="mt-4">
                <Label>Teams</Label>
                <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                  {teams.length === 0 && (
                    <div className="text-sm text-muted-foreground">No teams found or loading...</div>
                  )}
                  {teams.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTeamIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTeamIds((cur) => (cur.includes(t.id) ? cur : [...cur, t.id]));
                          else setSelectedTeamIds((cur) => cur.filter((x) => x !== t.id));
                        }}
                      />
                      <div className="text-sm">{t.name}</div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 shadow-card border-border/60 space-y-4">
            <div>
              <Label htmlFor="organizer">Organizer</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full mt-1.5 text-left px-3 py-2 border rounded-md bg-white">
                    {organizerName || "Select organizer"}
                    <ChevronsUpDown className="inline-block float-right" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-3">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search employees..." value={organizerQuery} onChange={(e) => setOrganizerQuery(e.target.value)} className="pl-9" />
                  </div>
                  <div className="max-h-48 overflow-y-auto p-1">
                    {empLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
                    {!empLoading && filteredEmployees.length === 0 && (
                      <div className="text-sm text-muted-foreground">No employees found.</div>
                    )}
                    {!empLoading && filteredEmployees.map((emp) => (
                      <div key={emp.id} className="py-2 px-2 hover:bg-secondary/40 rounded-md cursor-pointer transition-colors" onClick={() => { setOrganizerId(String(emp.id)); setOrganizerQuery(""); }}>
                        <div className="font-medium text-sm">{emp.first_name} {emp.last_name}</div>
                        <div className="text-xs text-muted-foreground">{emp.email}</div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5" />
            </div>

            <div className="flex items-center gap-2 mt-1">
              <input
                id="isRecurring"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => {
                  setIsRecurring(e.target.checked);
                  if (!e.target.checked) {
                    setRecurrenceDays([]);
                    setRecurrenceUntil("");
                  }
                }}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <Label htmlFor="isRecurring" className="text-xs font-semibold cursor-pointer">Is Recurring?</Label>
            </div>

            {isRecurring && (
              <div className="space-y-3">
                {/* Day-of-week pill picker */}
                <div>
                  <Label className="text-xs font-semibold">Repeat On <span className="text-muted-foreground font-normal">(leave empty for every day)</span></Label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {DAYS.map((label, idx) => {
                      const active = recurrenceDays.includes(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleRecurrenceDay(idx)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-foreground"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Repeat Until */}
                <div>
                  <Label htmlFor="recurrenceUntil" className="text-xs font-semibold">Repeat Until</Label>
                  <Input
                    id="recurrenceUntil"
                    type="date"
                    value={recurrenceUntil}
                    min={date}
                    onChange={(e) => setRecurrenceUntil(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start</Label>
                <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>End</Label>
                <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1.5" />
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote, Room 101" className="mt-1.5" />
            </div>

            <div>
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input id="meetingLink" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.example.com/..." className="mt-1.5" />
            </div>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => submit(true)} disabled={submitting}>Save draft</Button>
            <Button variant="secondary" onClick={reset} disabled={submitting}>Reset</Button>
            <Button onClick={() => handlePreSubmit()} disabled={submitting}>{submitting ? "Creating..." : "Create Event"}</Button>
          </div>
        </div>
      </div>

      <Dialog open={!!clashWarning} onOpenChange={(o) => !o && setClashWarning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scheduling Clash</DialogTitle>
            <DialogDescription>{clashWarning}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setClashWarning(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setClashWarning(null); submit(false, true); }}>Proceed Anyway</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Event Details</DialogTitle>
            <DialogDescription>Please review the details before creating the event.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-4 text-sm bg-secondary/30 p-4 rounded-md">
            <div><span className="font-semibold text-muted-foreground">Title:</span> {title}</div>
            {description && <div><span className="font-semibold text-muted-foreground">Description:</span> {description}</div>}
            <div><span className="font-semibold text-muted-foreground">Date & Time:</span> {date} from {start} to {end}</div>
            {location && <div><span className="font-semibold text-muted-foreground">Location:</span> {location}</div>}
            <div><span className="font-semibold text-muted-foreground">Organizer:</span> {organizerName}</div>
            <div>
              <span className="font-semibold text-muted-foreground">Invited Employees:</span>{" "}
              {inviteType !== "team" ? selectedEmployeeIds.length : 0}
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">Invited Teams:</span>{" "}
              {inviteType !== "individual" ? selectedTeamIds.length : 0}
            </div>
            {isRecurring && <div><span className="font-semibold text-muted-foreground">Recurring:</span> Until {recurrenceUntil}</div>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>Back</Button>
            <Button onClick={() => { setShowConfirmation(false); submit(false); }} disabled={submitting}>
              {submitting ? "Creating..." : "Confirm & Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );

}
