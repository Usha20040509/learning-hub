import { Calendar, Clock, Video, User } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TypeBadge } from "@/components/layout/AppLayout";
import type { AppEvent } from "@/lib/event-types";

export function EventCard({ event, onView }: { event: AppEvent; onView?: (e: AppEvent) => void }) {
  const hasMeetingLink = Boolean(event.meetingLink?.trim());

  return (
    <Card
      className="p-4 hover-lift transition-all border-border/60 shadow-soft cursor-pointer"
      onClick={() => onView?.(event)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <TypeBadge type={event.type} />
          </div>
          <h3 className="font-semibold text-sm leading-tight truncate">{event.title}</h3>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{format(new Date(event.date), "EEE, MMM d")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{event.startTime} – {event.endTime}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{event.organizer}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex -space-x-2">
          {event.participants.slice(0, 3).map((p) => (
            <Avatar key={p} className="h-6 w-6 border-2 border-card">
              <AvatarFallback className="text-[10px] bg-secondary">
                {p.split(" ").map((s) => s[0]).join("")}
              </AvatarFallback>
            </Avatar>
          ))}
          {event.participants.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-secondary border-2 border-card grid place-items-center text-[10px] font-medium text-muted-foreground">
              +{event.participants.length - 3}
            </div>
          )}
        </div>

        {hasMeetingLink && (
          <Button
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={(e) => {
              e.stopPropagation();
              window.open(event.meetingLink, "_blank", "noopener,noreferrer");
            }}
          >
            <Video className="h-3 w-3" />
            Join
          </Button>
        )}
      </div>
    </Card>
  );
}
