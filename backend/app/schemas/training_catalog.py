from pydantic import BaseModel


class TrainingCatalogCreate(BaseModel):
    code: str
    title: str
    description: str | None = None
    category: str | None = None
    duration_hours: int | None = None


class TrainingCatalogRead(TrainingCatalogCreate):
    id: int
