from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class EventParticipant(Base):
    __tablename__ = "event_participants"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="invited")
    attended: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    assignment_submitted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    assignment_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    event: Mapped["Event"] = relationship(back_populates="participants")
    employee: Mapped["Employee"] = relationship(back_populates="event_participations")
