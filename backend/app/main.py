from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.routers.dashboard import router as dashboard_router
from app.routers.employees import router as employees_router
from app.routers.events import router as events_router
from app.routers.health import router as health_router
from app.routers.teams import router as teams_router
from app.routers.training_catalog import router as training_catalog_router
from app.utils.exceptions import register_exception_handlers
from app.utils.logging import logger

app = FastAPI(title=settings.app_name, version="0.1.0", debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(",") if settings.allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
from app.routers.auth import router as auth_router

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(employees_router)
app.include_router(teams_router)
app.include_router(training_catalog_router)
app.include_router(events_router)
app.include_router(dashboard_router)


@app.on_event("startup")
def startup_event() -> None:
    logger.info("Learning Hub backend startup complete")


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Learning Hub API is running"}
