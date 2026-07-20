from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.dashboard import CalendarResponse, DashboardSummary, MySessionsResponse, DashboardLeaderboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(db)


@router.get("", response_model=DashboardSummary, summary="Get dashboard summary")
def get_dashboard(employee_id: int = Query(...), service: DashboardService = Depends(get_dashboard_service)) -> DashboardSummary:
    return service.get_dashboard(employee_id)


@router.get("/calendar", response_model=CalendarResponse, summary="Get calendar events")
def get_calendar(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    view: str = Query(default="month"),
    employee_id: int | None = Query(default=None),
    service: DashboardService = Depends(get_dashboard_service),
) -> CalendarResponse:
    return service.get_calendar(start_date=start_date, end_date=end_date, view=view, employee_id=employee_id)


@router.get("/my-sessions", response_model=MySessionsResponse, summary="Get my sessions")
def get_my_sessions(
    employee_id: int = Query(...),
    training: str | None = Query(default=None),
    workshop: str | None = Query(default=None),
    organizer: str | None = Query(default=None),
    date: datetime | None = Query(default=None),
    team: str | None = Query(default=None),
    service: DashboardService = Depends(get_dashboard_service),
) -> MySessionsResponse:
    return service.get_my_sessions(employee_id=employee_id, training=training, workshop=workshop, organizer=organizer, date=date, team=team)


@router.get("/leaderboard", response_model=DashboardLeaderboardResponse, summary="Get dashboard leaderboard")
def get_leaderboard(service: DashboardService = Depends(get_dashboard_service)) -> DashboardLeaderboardResponse:
    return service.get_leaderboard()
