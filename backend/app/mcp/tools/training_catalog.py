from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.repositories.training_catalog_repository import TrainingCatalogRepository
from app.services.training_catalog_service import TrainingCatalogService


def _build_service(db: Session) -> TrainingCatalogService:
    return TrainingCatalogService(TrainingCatalogRepository(db))


def register_training_catalog_tools(server: Any) -> None:
    @server.tool()
    def search_training_catalog(query: str | None = None, category: str | None = None) -> dict[str, Any]:
        db = next(get_db())
        try:
            service = _build_service(db)
            result = service.list(page=1, page_size=50, search=query, category=category)
            return {"items": [item.model_dump() for item in result.items], "total": result.total}
        finally:
            db.close()
