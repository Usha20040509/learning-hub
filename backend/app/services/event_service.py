from __future__ import annotations

from datetime import datetime

from app.models.event import Event
from app.models.event_participant import EventParticipant
from app.models.event_team import EventTeam
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.event_repository import EventRepository
from app.repositories.team_repository import TeamRepository
from app.schemas.common import PaginatedResponse
from app.schemas.event import EventCreate, EventRead
from app.utils.exceptions import APIException


class EventService:
    def __init__(self, repository: EventRepository, employee_repository: EmployeeRepository, team_repository: TeamRepository) -> None:
        self.repository = repository
        self.employee_repository = employee_repository
        self.team_repository = team_repository

    def list(self, page: int, page_size: int, search: str | None = None, status: str | None = None, start_after: datetime | None = None, end_before: datetime | None = None) -> PaginatedResponse[EventRead]:
        items = self.repository.list_filtered(search=search, status=status, start_after=start_after, end_before=end_before)
        total = len(items)
        start = (page - 1) * page_size
        end = start + page_size
        page_items = [self._to_read(item) for item in items[start:end]]
        pages = max((total + page_size - 1) // page_size, 1) if total else 1
        return PaginatedResponse(items=page_items, total=total, page=page, page_size=page_size, pages=pages)

    def get(self, event_id: int) -> EventRead:
        item = self.repository.get_by_id(event_id)
        if not item:
            raise APIException("Event not found", 404)
        return self._to_read(item)

    def create(self, data: EventCreate) -> EventRead:
        organizer = self.employee_repository.get_by_id(data.organizer_id)
        if not organizer:
            raise APIException("Organizer employee not found", 404)

        employee_ids = set(data.invited_employee_ids)
        team_ids = set(data.invited_team_ids)

        for team_id in team_ids:
            team = self.team_repository.get_by_id(team_id)
            if not team:
                raise APIException(f"Team {team_id} not found", 404)
            team_members = [member.employee_id for member in team.members]
            employee_ids.update(team_members)

        for employee_id in employee_ids:
            employee = self.employee_repository.get_by_id(employee_id)
            if not employee:
                raise APIException(f"Employee {employee_id} not found", 404)

        from datetime import timedelta
        import uuid

        if data.is_recurring and data.recurrence_until:
            current_start = data.start_time
            current_end = data.end_time
            until_date = data.recurrence_until.date()

            # If specific days were chosen, use that set; otherwise every day (0-6).
            allowed_days: set[int] = set(data.recurrence_days) if data.recurrence_days else set(range(7))

            first_saved_event = None
            series_id = str(uuid.uuid4())

            while current_start.date() <= until_date:
                # weekday() returns 0=Monday … 6=Sunday — matches our convention.
                if current_start.weekday() in allowed_days:
                    event = Event(
                        title=data.title,
                        description=data.description,
                        start_time=current_start,
                        end_time=current_end,
                        location=data.location,
                        status=data.status,
                        training_catalog_id=data.training_catalog_id,
                        organizer_id=data.organizer_id,
                        meeting_link=data.meeting_link or None,
                        assignment_included=data.assignment_included,
                        series_id=series_id,
                    )
                    saved = self.repository.add(event)
                    if not first_saved_event:
                        first_saved_event = saved

                    participant_rows = [
                        EventParticipant(event_id=saved.id, employee_id=emp_id)
                        for emp_id in sorted(employee_ids)
                    ]
                    self.repository.db.add_all(participant_rows)

                    team_rows = [
                        EventTeam(event_id=saved.id, team_id=team_id)
                        for team_id in sorted(team_ids)
                    ]
                    self.repository.db.add_all(team_rows)
                    self.repository.db.commit()

                current_start += timedelta(days=1)
                current_end += timedelta(days=1)

            if not first_saved_event:
                raise APIException(
                    "No occurrences were created — the selected days of the week never fall within the chosen date range.",
                    400,
                )

            return self._to_read(first_saved_event)
        else:
            event = Event(
                title=data.title,
                description=data.description,
                start_time=data.start_time,
                end_time=data.end_time,
                location=data.location,
                status=data.status,
                training_catalog_id=data.training_catalog_id,
                organizer_id=data.organizer_id,
                meeting_link=data.meeting_link or None,
                assignment_included=data.assignment_included,
            )
            saved = self.repository.add(event)

            participant_rows = [
                EventParticipant(event_id=saved.id, employee_id=employee_id)
                for employee_id in sorted(employee_ids)
            ]
            self.repository.db.add_all(participant_rows)

            team_rows = [
                EventTeam(event_id=saved.id, team_id=team_id)
                for team_id in sorted(team_ids)
            ]
            self.repository.db.add_all(team_rows)
            self.repository.db.commit()

            return self._to_read(saved)

    def update(self, event_id: int, data: EventCreate) -> EventRead:
        item = self.repository.get_by_id(event_id)
        if not item:
            raise APIException("Event not found", 404)
        for field, value in data.model_dump().items():
            setattr(item, field, value)
        self.repository.db.commit()
        self.repository.db.refresh(item)
        return self._to_read(item)

    def delete(self, event_id: int) -> None:
        item = self.repository.get_by_id(event_id)
        if not item:
            raise APIException("Event not found", 404)
        self.repository.delete(item)

    def upload_results(self, event_id: int, file_stream) -> None:
        import openpyxl
        wb = openpyxl.load_workbook(file_stream, data_only=True)
        ws = wb.active

        # Read headers
        headers = []
        for cell in next(ws.iter_rows(min_row=1, max_row=1, values_only=True)):
            if cell is not None:
                headers.append(str(cell).strip().lower())
            else:
                headers.append("")

        # Find column indices
        email_col = -1
        emp_id_col = -1
        attended_col = -1
        submitted_col = -1
        score_col = -1

        for idx, h in enumerate(headers):
            if "email" in h:
                email_col = idx
            elif "employee id" in h or "employee_id" in h or h == "id" or h == "employee code":
                emp_id_col = idx
            elif "attended" in h or "attendance" in h:
                attended_col = idx
            elif "submitted" in h or "submission" in h or "assignment" in h:
                submitted_col = idx
            elif "score" in h or "grade" in h or "points" in h:
                score_col = idx

        if email_col == -1 and emp_id_col == -1:
            raise APIException("Could not find email or employee ID column in Excel headers", 400)

        for row in ws.iter_rows(min_row=2, values_only=True):
            if not any(v is not None and str(v).strip() for v in row):
                continue

            # Find employee
            employee = None
            if email_col != -1 and email_col < len(row) and row[email_col]:
                email = str(row[email_col]).strip()
                employee = self.employee_repository.get_by_email(email)
            if not employee and emp_id_col != -1 and emp_id_col < len(row) and row[emp_id_col]:
                emp_id = str(row[emp_id_col]).strip()
                from app.models.employee import Employee as EmpModel
                employee = self.repository.db.query(EmpModel).filter(EmpModel.employee_id == emp_id).first()

            if not employee:
                continue

            # Get or create participation
            p = self.repository.db.query(EventParticipant).filter(
                EventParticipant.event_id == event_id,
                EventParticipant.employee_id == employee.id
            ).first()

            if not p:
                p = EventParticipant(event_id=event_id, employee_id=employee.id, status="invited")
                self.repository.db.add(p)

            # Update fields
            if attended_col != -1 and attended_col < len(row) and row[attended_col] is not None:
                val = str(row[attended_col]).strip().lower()
                p.attended = val in {"yes", "y", "true", "1", "attended"}
                if p.attended:
                    p.status = "attended"

            if submitted_col != -1 and submitted_col < len(row) and row[submitted_col] is not None:
                val = str(row[submitted_col]).strip().lower()
                p.assignment_submitted = val in {"yes", "y", "true", "1", "submitted", "completed"}

            if score_col != -1 and score_col < len(row) and row[score_col] is not None:
                try:
                    p.assignment_score = int(float(str(row[score_col]).strip()))
                except (ValueError, TypeError):
                    p.assignment_score = None

        self.repository.db.commit()

    def _to_read(self, item: Event) -> EventRead:
        organizer_name = None
        if item.organizer:
            organizer_name = f"{item.organizer.first_name} {item.organizer.last_name}"
        elif item.organizer_id:
            organizer = self.employee_repository.get_by_id(item.organizer_id)
            if organizer:
                organizer_name = f"{organizer.first_name} {organizer.last_name}"

        return EventRead(
            id=item.id,
            title=item.title,
            description=item.description,
            start_time=item.start_time,
            end_time=item.end_time,
            location=item.location,
            status=item.status,
            training_catalog_id=item.training_catalog_id,
            organizer_id=item.organizer_id,
            meeting_link=item.meeting_link,
            assignment_included=item.assignment_included,
            invited_employee_ids=[participant.employee_id for participant in item.participants],
            invited_team_ids=[invitation.team_id for invitation in item.invited_teams],
            organizer_name=organizer_name,
            invited_employee_names=[f"{p.employee.first_name} {p.employee.last_name}" for p in item.participants if p.employee],
            invited_team_names=[et.team.name for et in item.invited_teams if et.team],
            series_id=item.series_id,
        )
