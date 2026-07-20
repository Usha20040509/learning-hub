"""API routers package."""

from app.routers.employees import router as employees_router
from app.routers.events import router as events_router
from app.routers.health import router as health_router
from app.routers.teams import router as teams_router
from app.routers.training_catalog import router as training_catalog_router

__all__ = [
    "employees_router",
    "events_router",
    "health_router",
    "teams_router",
    "training_catalog_router",
]
