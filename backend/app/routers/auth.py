from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.employee import Employee

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr


class LoginResponse(BaseModel):
    id: int
    employee_id: str
    first_name: str
    last_name: str
    email: EmailStr
    department: str | None = None
    job_title: str | None = None
    group_name: str | None = None
    years_experience: str | None = None
    work_location: str | None = None


@router.post("/login", response_model=LoginResponse, summary="Login with employee email")
def login(data: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    """
    Login using your company email address.
    Only emails listed in the authorised employee roster will be accepted.
    """
    employee = (
        db.query(Employee)
        .filter(Employee.email == data.email.lower(), Employee.is_active == True)  # noqa: E712
        .first()
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not recognised. Please use your company email address.",
        )

    return LoginResponse(
        id=employee.id,
        employee_id=employee.employee_id,
        first_name=employee.first_name,
        last_name=employee.last_name,
        email=employee.email,
        department=employee.department,
        job_title=employee.job_title,
        group_name=employee.group_name,
        years_experience=employee.years_experience,
        work_location=employee.work_location,
    )
