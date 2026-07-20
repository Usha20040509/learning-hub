from typing import Generic, TypeVar

from sqlalchemy.orm import Session

from app.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class RepositoryBase(Generic[ModelType]):
    def __init__(self, db: Session, model: type[ModelType]) -> None:
        self.db = db
        self.model = model

    def get_by_id(self, item_id: int) -> ModelType | None:
        return self.db.query(self.model).filter(self.model.id == item_id).first()

    def list(self) -> list[ModelType]:
        return self.db.query(self.model).all()

    def add(self, item: ModelType) -> ModelType:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: ModelType) -> None:
        self.db.delete(item)
        self.db.commit()
