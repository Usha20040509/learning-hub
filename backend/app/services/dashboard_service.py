from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.event import Event
from app.models.event_participant import EventParticipant
from app.models.event_team import EventTeam
from app.models.team_member import TeamMember
from app.models.training_catalog import TrainingCatalog
from app.schemas.dashboard import CalendarEvent, CalendarResponse, DashboardSummary, MySessionItem, MySessionsResponse
from app.utils.exceptions import APIException


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_dashboard(self, employee_id: int) -> DashboardSummary:
        now = datetime.utcnow()
        upcoming = (
            self.db.query(Event)
            .join(EventParticipant)
            .filter(EventParticipant.employee_id == employee_id)
            .filter(Event.start_time >= now)
            .order_by(Event.start_time.asc())
            .limit(5)
            .all()
        )
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        todays = (
            self.db.query(Event)
            .join(EventParticipant)
            .filter(EventParticipant.employee_id == employee_id)
            .filter(and_(Event.start_time >= today_start, Event.start_time < today_end))
            .order_by(Event.start_time.asc())
            .all()
        )
        recent = (
            self.db.query(Event)
            .join(EventParticipant)
            .filter(EventParticipant.employee_id == employee_id)
            .filter(Event.start_time < now)
            .order_by(Event.start_time.desc())
            .limit(5)
            .all()
        )

        upcoming_payload = [self._to_event_item(event) for event in upcoming]
        todays_payload = [self._to_event_item(event) for event in todays]
        recent_payload = [self._to_event_item(event) for event in recent]
        next_session = upcoming_payload[0] if upcoming_payload else None

        # Fetch actual assignments for this user where event.assignment_included = True
        assignments_query = (
            self.db.query(EventParticipant)
            .join(Event)
            .filter(EventParticipant.employee_id == employee_id)
            .filter(Event.assignment_included == True)
            .order_by(Event.start_time.desc())
            .limit(5)
            .all()
        )

        assignments_payload = []
        for p in assignments_query:
            due_date = p.event.end_time
            due_str = f"Due {due_date.strftime('%b %d, %Y')}" if due_date else "No due date"
            assignments_payload.append({
                "id": p.id,
                "title": f"{p.event.title} - Assignment",
                "due": due_str,
                "status": "Submitted" if p.assignment_submitted else "Pending"
            })

        # Fetch recent activities for this user based on event participations
        activities_query = (
            self.db.query(EventParticipant)
            .join(Event)
            .filter(EventParticipant.employee_id == employee_id)
            .order_by(Event.start_time.desc())
            .limit(5)
            .all()
        )

        activities_payload = []
        for p in activities_query:
            if p.assignment_submitted:
                activities_payload.append({
                    "id": p.id * 10 + 1,
                    "text": f"Submitted {p.event.title} - Assignment",
                    "date": p.event.end_time.strftime('%b %d, %Y') if p.event.end_time else "Recent"
                })
            if p.attended:
                activities_payload.append({
                    "id": p.id * 10 + 2,
                    "text": f"Attended {p.event.title}",
                    "date": p.event.start_time.strftime('%b %d, %Y') if p.event.start_time else "Recent"
                })
            
            # Registration / schedule record (always show registration)
            activities_payload.append({
                "id": p.id * 10 + 3,
                "text": f"Registered for {p.event.title}",
                "date": p.event.created_at.strftime('%b %d, %Y') if p.event.created_at else "Recent"
            })

        activities_payload = activities_payload[:5]

        return DashboardSummary(
            upcoming_sessions=upcoming_payload,
            todays_sessions=todays_payload,
            next_session=next_session,
            recent_events=recent_payload,
            assignments=assignments_payload,
            recent_activities=activities_payload,
        )

    def get_calendar(self, start_date: datetime, end_date: datetime, view: str, employee_id: int | None = None) -> CalendarResponse:
        query = self.db.query(Event)
        if employee_id is not None:
            query = query.join(EventParticipant).filter(EventParticipant.employee_id == employee_id)
        query = query.filter(Event.start_time < end_date, Event.end_time > start_date)
        events = query.order_by(Event.start_time.asc()).all()
        payload = [self._to_calendar_event(event) for event in events]
        return CalendarResponse(events=payload, view=view, start_date=start_date, end_date=end_date)

    def get_my_sessions(
        self,
        employee_id: int,
        training: str | None = None,
        workshop: str | None = None,
        organizer: str | None = None,
        date: datetime | None = None,
        team: str | None = None,
    ) -> MySessionsResponse:
        query = self.db.query(Event).filter(Event.organizer_id == employee_id)

        if training:
            query = query.filter(Event.title.ilike(f"%{training}%"))
        if workshop:
            query = query.filter(Event.title.ilike(f"%{workshop}%"))
        if organizer:
            query = query.join(Employee, Event.organizer_id == Employee.id).filter(Employee.first_name.ilike(f"%{organizer}%") | Employee.last_name.ilike(f"%{organizer}%"))
        if date:
            day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            query = query.filter(and_(Event.start_time >= day_start, Event.start_time < day_end))
        if team:
            query = query.join(EventTeam, Event.id == EventTeam.event_id).join(TeamMember, TeamMember.team_id == EventTeam.team_id).filter(TeamMember.employee_id == employee_id)

        all_events = query.order_by(Event.start_time.asc()).all()
        now = datetime.utcnow()
        todays = [self._to_my_session_item(event) for event in all_events if self._is_today(event, now)]
        upcoming = [self._to_my_session_item(event) for event in all_events if event.start_time >= now and not self._is_today(event, now)]
        completed = [self._to_my_session_item(event) for event in all_events if event.end_time < now]
        return MySessionsResponse(todays_sessions=todays, upcoming_sessions=upcoming, completed_sessions=completed)

    def _to_event_item(self, event: Event) -> dict:
        return {
            "id": event.id,
            "title": event.title,
            "start_time": event.start_time,
            "end_time": event.end_time,
            "location": event.location,
            "status": event.status,
            "meeting_link": event.meeting_link,
            "organizer_name": self._get_organizer_name(event),
            "event_type": self._infer_event_type(event),
            "assignment_included": event.assignment_included,
        }

    def _to_calendar_event(self, event: Event) -> CalendarEvent:
        event_type = self._infer_event_type(event)
        return CalendarEvent(
            id=event.id,
            title=event.title,
            start_time=event.start_time,
            end_time=event.end_time,
            location=event.location,
            status=event.status,
            event_type=event_type,
            organizer_name=self._get_organizer_name(event),
            meeting_link=event.meeting_link,
            assignment_included=event.assignment_included,
        )

    def _to_my_session_item(self, event: Event) -> MySessionItem:
        return MySessionItem(
            id=event.id,
            title=event.title,
            start_time=event.start_time,
            end_time=event.end_time,
            status=event.status,
            event_type=self._infer_event_type(event),
            organizer_name=self._get_organizer_name(event),
            location=event.location,
            meeting_link=event.meeting_link,
            assignment_included=event.assignment_included,
        )

    def get_leaderboard(self) -> DashboardLeaderboardResponse:
        from app.models.employee import Employee
        from app.schemas.dashboard import LeaderboardItem, DashboardLeaderboardResponse

        employees = self.db.query(Employee).filter(Employee.is_active == True).all()

        leaderboard_items = []
        for emp in employees:
            participations = self.db.query(EventParticipant).filter(EventParticipant.employee_id == emp.id).all()
            emp_name = f"{emp.first_name} {emp.last_name}"

            total_parts = len(participations)
            attended_parts = sum(1 for p in participations if p.attended)
            attendance_rate = (attended_parts / total_parts) if total_parts > 0 else 0.0
            assignments_submitted = sum(1 for p in participations if p.assignment_submitted)

            leaderboard_items.append(LeaderboardItem(
                employee=emp_name,
                attendance=f"{int(attendance_rate * 100)}%",
                sessions_attended=attended_parts,
                assignments=assignments_submitted,
            ))

        # Sort by sessions attended desc, then assignments desc as tiebreaker
        leaderboard_items.sort(key=lambda x: (x.sessions_attended, x.assignments), reverse=True)

        return DashboardLeaderboardResponse(leaderboard=leaderboard_items)

    def _infer_event_type(self, event: Event) -> str:
        """Infer event type from catalog category, title keywords, or default to 'training'."""
        if event.training_catalog_id is not None:
            catalog_item = self.db.query(TrainingCatalog).filter(TrainingCatalog.id == event.training_catalog_id).first()
            if catalog_item and catalog_item.category:
                cat = catalog_item.category.lower()
                if "workshop" in cat:
                    return "workshop"
                if "training" in cat:
                    return "training"
        # Fall back to title keyword match
        title_lower = (event.title or "").lower()
        if "workshop" in title_lower:
            return "workshop"
        return "training"

    def _get_organizer_name(self, event: Event) -> str | None:
        if not event.organizer_id:
            return None
        organizer = self.db.query(Employee).filter(Employee.id == event.organizer_id).first()
        return f"{organizer.first_name} {organizer.last_name}" if organizer else None

    def _is_today(self, event: Event, now: datetime) -> bool:
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        return start <= event.start_time < end
