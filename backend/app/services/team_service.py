from __future__ import annotations

from app.models.team import Team
from app.repositories.team_repository import TeamRepository
from app.schemas.common import PaginatedResponse
from app.schemas.team import TeamCreate, TeamRead
from app.utils.exceptions import APIException


class TeamService:
    def __init__(self, repository: TeamRepository) -> None:
        self.repository = repository

    def list(self, page: int, page_size: int, search: str | None = None, is_active: bool | None = None) -> PaginatedResponse[TeamRead]:
        items = self.repository.list_filtered(search=search, is_active=is_active)
        total = len(items)
        start = (page - 1) * page_size
        end = start + page_size
        page_items = [self._to_read(item) for item in items[start:end]]
        pages = max((total + page_size - 1) // page_size, 1) if total else 1
        return PaginatedResponse(items=page_items, total=total, page=page, page_size=page_size, pages=pages)

    def get(self, team_id: int) -> TeamRead:
        item = self.repository.get_by_id(team_id)
        if not item:
            raise APIException("Team not found", 404)
        return self._to_read(item)

    def create(self, data: TeamCreate) -> TeamRead:
        team = Team(**data.model_dump())
        saved = self.repository.add(team)
        return self._to_read(saved)

    def update(self, team_id: int, data: TeamCreate) -> TeamRead:
        item = self.repository.get_by_id(team_id)
        if not item:
            raise APIException("Team not found", 404)
        for field, value in data.model_dump().items():
            setattr(item, field, value)
        self.repository.db.commit()
        self.repository.db.refresh(item)
        return self._to_read(item)

    def delete(self, team_id: int) -> None:
        item = self.repository.get_by_id(team_id)
        if not item:
            raise APIException("Team not found", 404)
        self.repository.delete(item)

    def _to_read(self, item: Team) -> TeamRead:
        active_members = [m for m in item.members if m.employee and m.employee.is_active] if item.members else []
        member_count = len(active_members)
        return TeamRead(
            id=item.id,
            team_code=item.team_code,
            name=item.name,
            description=item.description,
            is_active=item.is_active,
            member_count=member_count,
        )
