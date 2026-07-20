from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.event_participant import EventParticipant
    from app.models.team_member import TeamMember


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    employee_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(150), nullable=False)
    last_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    department: Mapped[str | None] = mapped_column(String(150), nullable=True)
    job_title: Mapped[str | None] = mapped_column(String(150), nullable=True)
    manager_id: Mapped[int | None] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Extra fields sourced from the employee Excel files
    group_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    years_experience: Mapped[str | None] = mapped_column(String(100), nullable=True)
    work_location: Mapped[str | None] = mapped_column(String(150), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False, default=lambda: __import__("datetime").datetime.utcnow())
    updated_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False, default=lambda: __import__("datetime").datetime.utcnow(), onupdate=lambda: __import__("datetime").datetime.utcnow())

    team_memberships: Mapped[list["TeamMember"]] = relationship(back_populates="employee", cascade="all, delete-orphan")
    event_participations: Mapped[list["EventParticipant"]] = relationship(back_populates="employee", cascade="all, delete-orphan")
