from __future__ import annotations

from app.models.employee import Employee
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.common import PaginatedResponse
from app.schemas.employee import EmployeeCreate, EmployeeRead
from app.utils.exceptions import APIException


class EmployeeService:
    def __init__(self, repository: EmployeeRepository) -> None:
        self.repository = repository

    def list(self, page: int, page_size: int, search: str | None = None, department: str | None = None, is_active: bool | None = None) -> PaginatedResponse[EmployeeRead]:
        items = self.repository.list_filtered(search=search, department=department, is_active=is_active)
        total = len(items)
        start = (page - 1) * page_size
        end = start + page_size
        page_items = [self._to_read(item) for item in items[start:end]]
        pages = max((total + page_size - 1) // page_size, 1) if total else 1
        return PaginatedResponse(items=page_items, total=total, page=page, page_size=page_size, pages=pages)

    def get(self, employee_id: int) -> EmployeeRead:
        item = self.repository.get_by_id(employee_id)
        if not item:
            raise APIException("Employee not found", 404)
        return self._to_read(item)

    def create(self, data: EmployeeCreate) -> EmployeeRead:
        if self.repository.get_by_email(data.email):
            raise APIException("Employee email already exists", 409)
        employee = Employee(**data.model_dump())
        saved = self.repository.add(employee)
        return self._to_read(saved)

    def update(self, employee_id: int, data: EmployeeCreate) -> EmployeeRead:
        item = self.repository.get_by_id(employee_id)
        if not item:
            raise APIException("Employee not found", 404)
        if data.email != item.email and self.repository.get_by_email(data.email):
            raise APIException("Employee email already exists", 409)
        for field, value in data.model_dump().items():
            setattr(item, field, value)
        self.repository.db.commit()
        self.repository.db.refresh(item)
        return self._to_read(item)

    def delete(self, employee_id: int) -> None:
        item = self.repository.get_by_id(employee_id)
        if not item:
            raise APIException("Employee not found", 404)
        self.repository.delete(item)

    def _to_read(self, item: Employee) -> EmployeeRead:
        return EmployeeRead(
            id=item.id,
            employee_id=item.employee_id,
            first_name=item.first_name,
            last_name=item.last_name,
            email=item.email,
            department=item.department,
            job_title=item.job_title,
            manager_id=item.manager_id,
            is_active=item.is_active,
        )
