from __future__ import annotations

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class EventTeam(Base):
    __tablename__ = "event_teams"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), nullable=False)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), nullable=False)

    event: Mapped["Event"] = relationship(back_populates="invited_teams")
    team: Mapped["Team"] = relationship(back_populates="invited_event_teams")
