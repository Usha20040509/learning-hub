from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.training_catalog import TrainingCatalog
from app.repositories.base import RepositoryBase


class TrainingCatalogRepository(RepositoryBase[TrainingCatalog]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, TrainingCatalog)

    def list_filtered(self, search: str | None = None, category: str | None = None) -> list[TrainingCatalog]:
        query = self.db.query(TrainingCatalog)
        if search:
            pattern = f"%{search.lower()}%"
            query = query.filter(
                TrainingCatalog.title.ilike(pattern)
                | TrainingCatalog.code.ilike(pattern)
                | TrainingCatalog.category.ilike(pattern)
                | TrainingCatalog.description.ilike(pattern)
            )
        if category:
            query = query.filter(TrainingCatalog.category == category)
        return query.order_by(TrainingCatalog.id).all()
