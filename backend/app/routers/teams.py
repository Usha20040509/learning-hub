from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.repositories.team_repository import TeamRepository
from app.schemas.common import PaginatedResponse
from app.schemas.team import TeamCreate, TeamRead
from app.services.team_service import TeamService

router = APIRouter(prefix="/teams", tags=["teams"])


def get_team_service(db: Session = Depends(get_db)) -> TeamService:
    return TeamService(TeamRepository(db))


@router.get("", response_model=PaginatedResponse[TeamRead], summary="List teams")
def list_teams(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    service: TeamService = Depends(get_team_service),
) -> PaginatedResponse[TeamRead]:
    return service.list(page=page, page_size=page_size, search=search, is_active=is_active)


@router.get("/{team_id}", response_model=TeamRead, summary="Get team")
def get_team(team_id: int, service: TeamService = Depends(get_team_service)) -> TeamRead:
    return service.get(team_id)


@router.post("", response_model=TeamRead, status_code=status.HTTP_201_CREATED, summary="Create team")
def create_team(data: TeamCreate, service: TeamService = Depends(get_team_service)) -> TeamRead:
    return service.create(data)


@router.put("/{team_id}", response_model=TeamRead, summary="Update team")
def update_team(team_id: int, data: TeamCreate, service: TeamService = Depends(get_team_service)) -> TeamRead:
    return service.update(team_id, data)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete team")
def delete_team(team_id: int, service: TeamService = Depends(get_team_service)) -> None:
    service.delete(team_id)
