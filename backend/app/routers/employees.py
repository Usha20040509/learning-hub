from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.common import PaginatedResponse
from app.schemas.employee import EmployeeCreate, EmployeeRead
from app.services.employee_service import EmployeeService

router = APIRouter(prefix="/employees", tags=["employees"])


def get_employee_service(db: Session = Depends(get_db)) -> EmployeeService:
    return EmployeeService(EmployeeRepository(db))


@router.get("", response_model=PaginatedResponse[EmployeeRead], summary="List employees")
def list_employees(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=500),
    search: str | None = Query(default=None),
    department: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    service: EmployeeService = Depends(get_employee_service),
) -> PaginatedResponse[EmployeeRead]:
    return service.list(page=page, page_size=page_size, search=search, department=department, is_active=is_active)


@router.get("/{employee_id}", response_model=EmployeeRead, summary="Get employee")
def get_employee(employee_id: int, service: EmployeeService = Depends(get_employee_service)) -> EmployeeRead:
    return service.get(employee_id)


@router.post("", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED, summary="Create employee")
def create_employee(data: EmployeeCreate, service: EmployeeService = Depends(get_employee_service)) -> EmployeeRead:
    return service.create(data)


@router.put("/{employee_id}", response_model=EmployeeRead, summary="Update employee")
def update_employee(employee_id: int, data: EmployeeCreate, service: EmployeeService = Depends(get_employee_service)) -> EmployeeRead:
    return service.update(employee_id, data)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete employee")
def delete_employee(employee_id: int, service: EmployeeService = Depends(get_employee_service)) -> None:
    service.delete(employee_id)
