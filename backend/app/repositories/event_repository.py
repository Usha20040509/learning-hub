from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.event import Event
from app.repositories.base import RepositoryBase


class EventRepository(RepositoryBase[Event]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Event)

    def list_filtered(self, search: str | None = None, status: str | None = None, start_after: datetime | None = None, end_before: datetime | None = None) -> list[Event]:
        query = self.db.query(Event)
        if search:
            pattern = f"%{search.lower()}%"
            query = query.filter(Event.title.ilike(pattern) | Event.description.ilike(pattern) | Event.location.ilike(pattern))
        if status:
            query = query.filter(Event.status == status)
        if start_after:
            query = query.filter(Event.start_time >= start_after)
        if end_before:
            query = query.filter(Event.end_time <= end_before)
        return query.order_by(Event.start_time).all()
