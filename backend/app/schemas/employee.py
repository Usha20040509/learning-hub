from pydantic import BaseModel, EmailStr


class EmployeeCreate(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    email: EmailStr
    department: str | None = None
    job_title: str | None = None
    manager_id: int | None = None
    is_active: bool = True
    group_name: str | None = None
    years_experience: str | None = None
    work_location: str | None = None


class EmployeeRead(EmployeeCreate):
    id: int
