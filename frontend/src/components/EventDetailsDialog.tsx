import { format } from "date-fns";
import { Calendar, Clock, Users, Video, MapPin, Paperclip, User } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { TypeBadge } from "@/components/layout/AppLayout";
import { Link } from "@tanstack/react-router";
import type { AppEvent } from "@/lib/event-types";
import { getCurrentUser, isManagerWithEditAccess } from "@/lib/auth";
import { uploadEventResults } from "@/lib/api";
import { toast } from "sonner";

export function EventDetailsDialog({
  event,
  open,
  onOpenChange,
}: {
  event: AppEvent | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!event) return null;

  const currentUser = getCurrentUser();
  const isOrganizer = currentUser && (event.organizerId === currentUser.id || event.ownerId === currentUser.id || isManagerWithEditAccess(currentUser));
  const hasMeetingLink = Boolean(event.meetingLink?.trim());

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const numericId = Number(event.id.replace("evt-", ""));
      await uploadEventResults(numericId, file);
      toast.success("Attendance and assignment results uploaded successfully!");
      setFile(null);
      onOpenChange(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload results.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <TypeBadge type={event.type} />
          </div>
          <DialogTitle className="text-xl pr-8">{event.title}</DialogTitle>
          <DialogDescription>{event.description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <InfoRow icon={Calendar} label="Date" value={format(new Date(event.date), "EEEE, MMMM d, yyyy")} />
          <InfoRow icon={Clock} label="Time" value={`${event.startTime} – ${event.endTime} (${event.durationMin} min)`} />
          <InfoRow icon={User} label="Organizer" value={event.organizer} />
          <InfoRow icon={MapPin} label="Location" value={event.location || "Remote"} />
          <InfoRow icon={Users} label="Invited" value={`${event.invitedCount} people`} />
        </div>

        {event.teamsInvited.length > 0 && (
          <>
            <Separator className="my-2" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Teams invited
              </div>
              <div className="flex flex-wrap gap-1.5">
                {event.teamsInvited.map((t) => (
                  <span key={t} className="text-xs bg-secondary rounded-md px-2 py-1">{t}</span>
                ))}
              </div>
            </div>
          </>
        )}

        {event.participants.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Participants ({event.participants.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {event.participants.map((p) => (
                <div key={p} className="flex items-center gap-1.5 bg-secondary rounded-full pl-1 pr-3 py-0.5">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[9px]">
                      {p.split(" ").map((s) => s[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {event.attachments.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Attachments
            </div>
            <div className="space-y-1.5">
              {event.attachments.map((a) => (
                <div key={a.name} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1">{a.name}</span>
                  <span className="text-xs text-muted-foreground">{a.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isOrganizer && (
          <>
            <Separator className="my-2" />
            <div className="bg-secondary/40 p-4 rounded-xl space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Upload Session Results (Organizer Control)
              </div>
              <p className="text-[11px] text-muted-foreground">
                Upload an Excel file (.xlsx) containing columns: <code className="bg-secondary px-1 py-0.5 rounded text-destructive font-medium">Email</code> (or <code className="bg-secondary px-1 py-0.5 rounded text-destructive font-medium">Employee ID</code>), <code className="bg-secondary px-1 py-0.5 rounded text-destructive font-medium">Attended</code>, <code className="bg-secondary px-1 py-0.5 rounded text-destructive font-medium">Assignment Submitted</code>, and optional <code className="bg-secondary px-1 py-0.5 rounded text-destructive font-medium">Score</code> to update dashboard leaderboard statistics.
              </p>
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="text-xs border rounded-md p-1 bg-white flex-1 cursor-pointer"
                />
                <Button
                  size="sm"
                  disabled={!file || uploading}
                  onClick={handleUpload}
                >
                  {uploading ? "Uploading..." : "Upload Results"}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/edit-event/$eventId" params={{ eventId: event.id.replace("evt-", "") }}>
                    Edit Event
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {hasMeetingLink && (
            <Button
              className="gap-1.5"
              onClick={() => window.open(event.meetingLink, "_blank", "noopener,noreferrer")}
            >
              <Video className="h-4 w-4" />
              Join Meeting
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
