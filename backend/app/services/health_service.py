from app.repositories.health_repository import HealthRepository
from app.schemas.health import HealthResponse


class HealthService:
    def __init__(self, repository: HealthRepository):
        self.repository = repository

    def get_health(self) -> HealthResponse:
        status = self.repository.get_status()
        return HealthResponse(status=status, service="internal-training-portal")
