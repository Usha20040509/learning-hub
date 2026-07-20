from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.repositories.training_catalog_repository import TrainingCatalogRepository
from app.schemas.common import PaginatedResponse
from app.schemas.training_catalog import TrainingCatalogCreate, TrainingCatalogRead
from app.services.training_catalog_service import TrainingCatalogService

router = APIRouter(prefix="/training-catalog", tags=["training-catalog"])


def get_training_catalog_service(db: Session = Depends(get_db)) -> TrainingCatalogService:
    return TrainingCatalogService(TrainingCatalogRepository(db))


@router.get("", response_model=PaginatedResponse[TrainingCatalogRead], summary="List training catalog")
def list_training_catalog(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    service: TrainingCatalogService = Depends(get_training_catalog_service),
) -> PaginatedResponse[TrainingCatalogRead]:
    return service.list(page=page, page_size=page_size, search=search, category=category)


@router.get("/{catalog_id}", response_model=TrainingCatalogRead, summary="Get training catalog entry")
def get_training_catalog_entry(catalog_id: int, service: TrainingCatalogService = Depends(get_training_catalog_service)) -> TrainingCatalogRead:
    return service.get(catalog_id)


@router.post("", response_model=TrainingCatalogRead, status_code=status.HTTP_201_CREATED, summary="Create training catalog entry")
def create_training_catalog_entry(data: TrainingCatalogCreate, service: TrainingCatalogService = Depends(get_training_catalog_service)) -> TrainingCatalogRead:
    return service.create(data)


@router.put("/{catalog_id}", response_model=TrainingCatalogRead, summary="Update training catalog entry")
def update_training_catalog_entry(catalog_id: int, data: TrainingCatalogCreate, service: TrainingCatalogService = Depends(get_training_catalog_service)) -> TrainingCatalogRead:
    return service.update(catalog_id, data)


@router.delete("/{catalog_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete training catalog entry")
def delete_training_catalog_entry(catalog_id: int, service: TrainingCatalogService = Depends(get_training_catalog_service)) -> None:
    service.delete(catalog_id)
