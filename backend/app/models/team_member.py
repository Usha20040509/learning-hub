from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    role: Mapped[str | None] = mapped_column(nullable=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    team: Mapped["Team"] = relationship(back_populates="members")
    employee: Mapped["Employee"] = relationship(back_populates="team_memberships")
