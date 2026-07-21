from pydantic import BaseModel


class EmployeeSync(BaseModel):
    employee_code: str
    employee_name: str
    email: str

    designation: str | None = None
    years_of_experience: int | None = None
    group: str | None = None
    work_location: str | None = None


class EmployeeSyncRequest(BaseModel):
    employees: list[EmployeeSync]


class SyncResponse(BaseModel):
    created: int
    updated: int
    failed: int
