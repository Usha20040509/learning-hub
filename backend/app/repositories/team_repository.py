from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.team import Team
from app.repositories.base import RepositoryBase


class TeamRepository(RepositoryBase[Team]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Team)

    def list_filtered(self, search: str | None = None, is_active: bool | None = None) -> list[Team]:
        query = self.db.query(Team)
        if search:
            pattern = f"%{search.lower()}%"
            query = query.filter(Team.name.ilike(pattern) | Team.team_code.ilike(pattern) | Team.description.ilike(pattern))
        if is_active is not None:
            query = query.filter(Team.is_active == is_active)
        return query.order_by(Team.id).all()
