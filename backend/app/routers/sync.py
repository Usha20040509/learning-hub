from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.session import get_db
from app.schemas.sync import EmployeeSyncRequest, SyncResponse
from app.services.sync_service import sync_employees

router = APIRouter(prefix="/sync", tags=["sync"])


def verify_api_key(x_api_key: str = Header(...)) -> None:
    if x_api_key != settings.sync_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )


@router.post("/employees", response_model=SyncResponse, dependencies=[Depends(verify_api_key)])
def sync_employees_endpoint(request: EmployeeSyncRequest, db: Session = Depends(get_db)) -> SyncResponse:
    return sync_employees(db, request)
