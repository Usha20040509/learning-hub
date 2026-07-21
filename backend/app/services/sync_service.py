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

    for employee_data in request.employees:
        try:
            _, is_created = repo.upsert_employee(employee_data)
            if is_created:
                created += 1
            else:
                updated += 1
        except Exception as e:
            logger.error(f"Failed to sync employee {employee_data.employee_code}: {e}")
            failed += 1

    return SyncResponse(created=created, updated=updated, failed=failed)
