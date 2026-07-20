from datetime import datetime

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.event_repository import EventRepository
from app.repositories.team_repository import TeamRepository
from app.schemas.common import PaginatedResponse
from app.schemas.event import EventCreate, EventRead
from app.services.event_service import EventService

router = APIRouter(prefix="/events", tags=["events"])


def get_event_service(db: Session = Depends(get_db)) -> EventService:
    return EventService(EventRepository(db), EmployeeRepository(db), TeamRepository(db))


@router.get("", response_model=PaginatedResponse[EventRead], summary="List events")
def list_events(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    start_after: datetime | None = Query(default=None),
    end_before: datetime | None = Query(default=None),
    service: EventService = Depends(get_event_service),
) -> PaginatedResponse[EventRead]:
    return service.list(page=page, page_size=page_size, search=search, status=status, start_after=start_after, end_before=end_before)


@router.get("/{event_id}", response_model=EventRead, summary="Get event")
def get_event(event_id: int, service: EventService = Depends(get_event_service)) -> EventRead:
    return service.get(event_id)


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED, summary="Create event")
def create_event(data: EventCreate, service: EventService = Depends(get_event_service)) -> EventRead:
    return service.create(data)


@router.put("/{event_id}", response_model=EventRead, summary="Update event")
def update_event(event_id: int, data: EventCreate, service: EventService = Depends(get_event_service)) -> EventRead:
    return service.update(event_id, data)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete event")
def delete_event(event_id: int, delete_series: bool = False, service: EventService = Depends(get_event_service)) -> None:
    service.delete(event_id, delete_series=delete_series)


@router.post("/{event_id}/upload-results", summary="Upload attendance/assignment Excel results")
def upload_event_results(event_id: int, file: UploadFile = File(...), service: EventService = Depends(get_event_service)) -> dict:
    service.upload_results(event_id, file.file)
    return {"message": "Results uploaded and processed successfully"}
