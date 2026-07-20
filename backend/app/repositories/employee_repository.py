from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.repositories.base import RepositoryBase


class EmployeeRepository(RepositoryBase[Employee]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Employee)

    def get_by_email(self, email: str) -> Employee | None:
        return self.db.query(Employee).filter(Employee.email == email).first()

    def list_filtered(self, search: str | None = None, department: str | None = None, is_active: bool | None = None) -> list[Employee]:
        query = self.db.query(Employee)
        if search:
            pattern = f"%{search.lower()}%"
            query = query.filter(
                Employee.first_name.ilike(pattern)
                | Employee.last_name.ilike(pattern)
                | Employee.email.ilike(pattern)
                | Employee.department.ilike(pattern)
            )
        if department:
            depts = [d.strip() for d in department.split(",")]
            query = query.filter(Employee.department.in_(depts))
        if is_active is not None:
            query = query.filter(Employee.is_active == is_active)
        return query.order_by(Employee.id).all()
