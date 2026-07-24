from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.employee import Employee
    from app.models.event_participant import EventParticipant
    from app.models.event_team import EventTeam
    from app.models.training_catalog import TrainingCatalog


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="scheduled")
    training_catalog_id: Mapped[int | None] = mapped_column(ForeignKey("training_catalog.id"), nullable=True)
    organizer_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    owner_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    meeting_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    assignment_included: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    series_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    catalog_item: Mapped["TrainingCatalog | None"] = relationship(back_populates="events")
    organizer: Mapped["Employee | None"] = relationship(foreign_keys=[organizer_id])
    owner: Mapped["Employee | None"] = relationship(foreign_keys=[owner_id])
    participants: Mapped[list["EventParticipant"]] = relationship(back_populates="event", cascade="all, delete-orphan")
    invited_teams: Mapped[list["EventTeam"]] = relationship(back_populates="event", cascade="all, delete-orphan")
