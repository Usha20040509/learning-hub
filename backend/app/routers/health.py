from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.repositories.health_repository import HealthRepository
from app.schemas.health import HealthResponse
from app.services.health_service import HealthService

router = APIRouter(prefix="/health", tags=["health"])


def get_health_service(db: Session = Depends(get_db)) -> HealthService:
    repository = HealthRepository(db)
    return HealthService(repository)


@router.get("", response_model=HealthResponse)
def read_health(service: HealthService = Depends(get_health_service)) -> HealthResponse:
    return service.get_health()
