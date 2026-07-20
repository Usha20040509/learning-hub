from __future__ import annotations

from __future__ import annotations

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    team_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False, default=lambda: __import__("datetime").datetime.utcnow())
    updated_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False, default=lambda: __import__("datetime").datetime.utcnow(), onupdate=lambda: __import__("datetime").datetime.utcnow())

    members: Mapped[list["TeamMember"]] = relationship(back_populates="team", cascade="all, delete-orphan")
    invited_event_teams: Mapped[list["EventTeam"]] = relationship(back_populates="team", cascade="all, delete-orphan")
