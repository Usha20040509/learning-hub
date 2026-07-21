import logging
from sqlalchemy.orm import Session
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.sync import EmployeeSyncRequest, SyncResponse

logger = logging.getLogger(__name__)


def sync_employees(db: Session, request: EmployeeSyncRequest) -> SyncResponse:
    repo = EmployeeRepository(db)
    created = 0
    updated = 0
    failed = 0
    deleted = 0
    
    active_employee_codes = []

    for employee_data in request.employees:
        try:
            _, is_created = repo.upsert_employee(employee_data)
            active_employee_codes.append(employee_data.employee_code)
            if is_created:
                created += 1
            else:
                updated += 1
        except Exception as e:
            logger.error(f"Failed to parse or add employee {employee_data.employee_code} to session: {e}")
            failed += 1

    try:
        if active_employee_codes:
            deleted = repo.delete_missing_employees(active_employee_codes)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to commit bulk sync operation: {e}")
        db.rollback()
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Database commit failed: {str(e)}")

    return SyncResponse(created=created, updated=updated, failed=failed, deleted=deleted)
