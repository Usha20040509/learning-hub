from __future__ import annotations

import re
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.repositories.base import RepositoryBase
from app.schemas.sync import EmployeeSync


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

    def delete_missing_employees(self, active_employee_codes: list[str]) -> int:
        if not active_employee_codes:
            return 0
        return self.db.query(Employee).filter(Employee.employee_id.notin_(active_employee_codes)).delete(synchronize_session=False)

    def get_by_employee_code(self, employee_code: str) -> Employee | None:
        return self.db.query(Employee).filter(Employee.employee_id == employee_code).first()

    def _parse_experience(self, exp: str | None) -> str | None:
        if not exp:
            return None
        
        exp = str(exp).strip()
        years_match = re.search(r'(\d+)\s*year', exp, re.IGNORECASE)
        months_match = re.search(r'(\d+)\s*month', exp, re.IGNORECASE)
        
        years = int(years_match.group(1)) if years_match else 0
        months = int(months_match.group(1)) if months_match else 0
        
        if years == 0 and months == 0:
            num_match = re.search(r'(\d+(\.\d+)?)', exp)
            if num_match:
                return num_match.group(1)
            return exp
            
        total_years = years + (months / 12.0)
        return f"{total_years:.1f}"

    def upsert_employee(self, sync_data: EmployeeSync) -> tuple[Employee, bool]:
        employee = self.get_by_employee_code(sync_data.employee_code)
        is_created = False

        name_parts = sync_data.employee_name.strip().split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        
        parsed_exp = self._parse_experience(sync_data.years_of_experience)

        if not employee:
            employee = Employee(
                employee_id=sync_data.employee_code,
                first_name=first_name,
                last_name=last_name,
                email=sync_data.email,
                job_title=sync_data.designation,
                years_experience=parsed_exp,
                group_name=sync_data.group,
                work_location=sync_data.work_location,
            )
            self.db.add(employee)
            is_created = True
        else:
            employee.first_name = first_name
            employee.last_name = last_name
            employee.email = sync_data.email
            if sync_data.designation is not None:
                employee.job_title = sync_data.designation
            if sync_data.years_of_experience is not None:
                employee.years_experience = parsed_exp
            if sync_data.group is not None:
                employee.group_name = sync_data.group
            if sync_data.work_location is not None:
                employee.work_location = sync_data.work_location

        return employee, is_created
