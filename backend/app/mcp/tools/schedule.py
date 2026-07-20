from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.event_repository import EventRepository
from app.repositories.team_repository import TeamRepository
from app.services.event_service import EventService


def _build_event_service(db: Session) -> EventService:
    return EventService(EventRepository(db), EmployeeRepository(db), TeamRepository(db))


def register_schedule_tools(server: Any) -> None:
    @server.tool()
    def get_user_schedule(employee_id: int, start_date: str | None = None, end_date: str | None = None) -> dict[str, Any]:
        db = next(get_db())
        try:
            service = _build_event_service(db)
            start_dt = datetime.fromisoformat(start_date) if start_date else None
            end_dt = datetime.fromisoformat(end_date) if end_date else None
            results = service.list(page=1, page_size=100, search=None, status=None, start_after=start_dt, end_before=end_dt)
            items = [item.model_dump() for item in results.items if item.organizer_id == employee_id or employee_id in item.invited_employee_ids]
            return {"employee_id": employee_id, "items": items, "total": len(items)}
        finally:
            db.close()

    @server.tool()
    def get_team_schedule(team_id: int, start_date: str | None = None, end_date: str | None = None) -> dict[str, Any]:
        db = next(get_db())
        try:
            service = _build_event_service(db)
            start_dt = datetime.fromisoformat(start_date) if start_date else None
            end_dt = datetime.fromisoformat(end_date) if end_date else None
            results = service.list(page=1, page_size=100, search=None, status=None, start_after=start_dt, end_before=end_dt)
            items = [item.model_dump() for item in results.items if team_id in item.invited_team_ids]
            return {"team_id": team_id, "items": items, "total": len(items)}
        finally:
            db.close()

    @server.tool()
    def find_free_slots(employee_id: int, start_date: str, end_date: str, slot_minutes: int = 60) -> dict[str, Any]:
        db = next(get_db())
        try:
            service = _build_event_service(db)
            start_dt = datetime.fromisoformat(start_date)
            end_dt = datetime.fromisoformat(end_date)
            results = service.list(page=1, page_size=200, search=None, status=None, start_after=start_dt, end_before=end_dt)
            items = [item for item in results.items if item.organizer_id == employee_id or employee_id in item.invited_employee_ids]
            slots: list[dict[str, Any]] = []
            cursor = start_dt
            while cursor + timedelta(minutes=slot_minutes) <= end_dt:
                slot_end = cursor + timedelta(minutes=slot_minutes)
                conflicts = [item for item in items if not (slot_end <= item.start_time or cursor >= item.end_time)]
                if not conflicts:
                    slots.append({"start_time": cursor.isoformat(), "end_time": slot_end.isoformat()})
                cursor = slot_end
            return {"employee_id": employee_id, "slot_minutes": slot_minutes, "slots": slots}
        finally:
            db.close()
