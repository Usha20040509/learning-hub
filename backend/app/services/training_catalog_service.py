from __future__ import annotations

from app.models.training_catalog import TrainingCatalog
from app.repositories.training_catalog_repository import TrainingCatalogRepository
from app.schemas.common import PaginatedResponse
from app.schemas.training_catalog import TrainingCatalogCreate, TrainingCatalogRead
from app.utils.exceptions import APIException


class TrainingCatalogService:
    def __init__(self, repository: TrainingCatalogRepository) -> None:
        self.repository = repository

    def list(self, page: int, page_size: int, search: str | None = None, category: str | None = None) -> PaginatedResponse[TrainingCatalogRead]:
        items = self.repository.list_filtered(search=search, category=category)
        total = len(items)
        start = (page - 1) * page_size
        end = start + page_size
        page_items = [self._to_read(item) for item in items[start:end]]
        pages = max((total + page_size - 1) // page_size, 1) if total else 1
        return PaginatedResponse(items=page_items, total=total, page=page, page_size=page_size, pages=pages)

    def get(self, catalog_id: int) -> TrainingCatalogRead:
        item = self.repository.get_by_id(catalog_id)
        if not item:
            raise APIException("Training catalog entry not found", 404)
        return self._to_read(item)

    def create(self, data: TrainingCatalogCreate) -> TrainingCatalogRead:
        catalog_item = TrainingCatalog(**data.model_dump())
        saved = self.repository.add(catalog_item)
        return self._to_read(saved)

    def update(self, catalog_id: int, data: TrainingCatalogCreate) -> TrainingCatalogRead:
        item = self.repository.get_by_id(catalog_id)
        if not item:
            raise APIException("Training catalog entry not found", 404)
        for field, value in data.model_dump().items():
            setattr(item, field, value)
        self.repository.db.commit()
        self.repository.db.refresh(item)
        return self._to_read(item)

    def delete(self, catalog_id: int) -> None:
        item = self.repository.get_by_id(catalog_id)
        if not item:
            raise APIException("Training catalog entry not found", 404)
        self.repository.delete(item)

    def _to_read(self, item: TrainingCatalog) -> TrainingCatalogRead:
        return TrainingCatalogRead(
            id=item.id,
            code=item.code,
            title=item.title,
            description=item.description,
            category=item.category,
            duration_hours=item.duration_hours,
        )
