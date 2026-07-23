import logging
import re
from sqlalchemy.orm import Session
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.sync import EmployeeSyncRequest, SyncResponse
from app.models.team import Team
from app.models.team_member import TeamMember

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
            employee, is_created = repo.upsert_employee(employee_data)

            # Flush immediately so the employee gets a DB-assigned id before
            # we try to use it in TeamMember.  Without this flush, employee.id
            # is None for newly-created rows, causing NotNullViolation.
            db.flush()

            active_employee_codes.append(employee_data.employee_code)

            if employee.job_title:
                team_name = employee.job_title.strip()
                if team_name:
                    team = db.query(Team).filter(Team.name == team_name).first()
                    if not team:
                        code_name = re.sub(r'[^a-zA-Z0-9]', '', team_name).lower()
                        team = Team(team_code=code_name, name=team_name, description=f"Team for {team_name}")
                        db.add(team)
                        db.flush()  # resolve team.id before using it

                    member = db.query(TeamMember).filter(
                        TeamMember.team_id == team.id,
                        TeamMember.employee_id == employee.id,
                    ).first()
                    if not member:
                        db.add(TeamMember(team_id=team.id, employee_id=employee.id, role="Member"))

            if is_created:
                created += 1
            else:
                updated += 1

        except Exception as e:
            # Roll back only the current employee's work via a savepoint so the
            # rest of the batch is not affected.
            logger.error(
                f"Failed to process employee {employee_data.employee_code}: {e}"
            )
            db.rollback()
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
