from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.event_repository import EventRepository
from app.repositories.team_repository import TeamRepository
from app.schemas.event import EventCreate
from app.services.event_service import EventService


def _build_event_service(db: Session) -> EventService:
    return EventService(EventRepository(db), EmployeeRepository(db), TeamRepository(db))


def register_event_tools(server: Any) -> None:
    @server.tool()
    def search_events(query: str | None = None, status: str | None = None, start_after: str | None = None, end_before: str | None = None) -> dict[str, Any]:
        db = next(get_db())
        try:
            service = _build_event_service(db)
            start_dt = datetime.fromisoformat(start_after) if start_after else None
            end_dt = datetime.fromisoformat(end_before) if end_before else None
            result = service.list(page=1, page_size=50, search=query, status=status, start_after=start_dt, end_before=end_dt)
            return {"items": [item.model_dump() for item in result.items], "total": result.total}
        finally:
            db.close()

    @server.tool()
    def create_event(title: str, start_time: str, end_time: str, organizer_id: int, description: str | None = None, location: str | None = None, status: str = "scheduled", training_catalog_id: int | None = None, meeting_link: str | None = None, invited_employee_ids: list[int] | None = None, invited_team_ids: list[int] | None = None) -> dict[str, Any]:
        db = next(get_db())
        try:
            service = _build_event_service(db)
            payload = EventCreate(
                title=title,
                description=description,
                start_time=datetime.fromisoformat(start_time),
                end_time=datetime.fromisoformat(end_time),
                location=location,
                status=status,
                training_catalog_id=training_catalog_id,
                organizer_id=organizer_id,
                meeting_link=meeting_link,
                invited_employee_ids=invited_employee_ids or [],
                invited_team_ids=invited_team_ids or [],
            )
            result = service.create(payload)
            return result.model_dump()
        finally:
            db.close()

    @server.tool()
    def update_event(event_id: int, title: str | None = None, start_time: str | None = None, end_time: str | None = None, organizer_id: int | None = None, description: str | None = None, location: str | None = None, status: str | None = None, training_catalog_id: int | None = None, meeting_link: str | None = None, invited_employee_ids: list[int] | None = None, invited_team_ids: list[int] | None = None) -> dict[str, Any]:
        db = next(get_db())
        try:
            service = _build_event_service(db)
            payload = EventCreate(
                title=title or "",
                description=description,
                start_time=datetime.fromisoformat(start_time) if start_time else datetime.utcnow(),
                end_time=datetime.fromisoformat(end_time) if end_time else datetime.utcnow(),
                location=location,
                status=status or "scheduled",
                training_catalog_id=training_catalog_id,
                organizer_id=organizer_id if organizer_id is not None else 0,
                meeting_link=meeting_link,
                invited_employee_ids=invited_employee_ids or [],
                invited_team_ids=invited_team_ids or [],
            )
            result = service.update(event_id, payload)
            return result.model_dump()
        finally:
            db.close()

    @server.tool()
    def delete_event(event_id: int) -> dict[str, Any]:
        db = next(get_db())
        try:
            service = _build_event_service(db)
            service.delete(event_id)
            return {"deleted": True, "event_id": event_id}
        finally:
            db.close()
