"""Auth router – verifies Firebase ID tokens and returns employee profile data."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.employee import Employee
from app.utils.firebase import verify_firebase_token

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class FirebaseLoginRequest(BaseModel):
    """Body sent by the frontend after the user signs in via Firebase."""

    id_token: str  # Firebase ID token obtained from getIdToken()


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


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login with a Firebase ID token",
)
def login(data: FirebaseLoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    """
    Accepts a Firebase ID token, verifies it with the Firebase Admin SDK,
    then looks up the authenticated user's email in the employee roster.
    Only active employees are allowed access.
    """
    # 1. Verify the token with Firebase Admin SDK
    try:
        decoded = verify_firebase_token(data.id_token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired Firebase token: {exc}",
        )

    firebase_email: str = (decoded.get("email") or "").lower()
    if not firebase_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase token does not contain an email address.",
        )

    # 2. Look up the employee in the company roster
    employee = (
        db.query(Employee)
        .filter(
            Employee.email == firebase_email,
            Employee.is_active == True,  # noqa: E712
        )
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
