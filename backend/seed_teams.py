"""
Seed teams from employee designations.
Each unique job_title becomes a Team. All employees with that title
are added as TeamMembers.

Run from backend/ directory:
    python seed_teams.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.models.employee import Employee
from app.models.team import Team
from app.models.team_member import TeamMember


def _ensure_schema() -> None:
    Base.metadata.create_all(bind=engine)


def seed_teams() -> None:
    _ensure_schema()
    db: Session = SessionLocal()
    try:
        # Wipe existing teams and memberships (cascade handles team_members)
        db.execute(delete(TeamMember))
        db.execute(delete(Team))
        db.commit()

        # Collect distinct designations
        rows = db.query(Employee.job_title).filter(Employee.job_title != None).distinct().order_by(Employee.job_title).all()
        designations = [r[0].strip() for r in rows if r[0] and r[0].strip()]

        for designation in designations:
            # Build a safe team_code from the designation
            team_code = designation.lower().replace(" ", "-").replace("/", "-")

            team = Team(
                team_code=team_code,
                name=designation,
                description=f"All employees with designation: {designation}",
                is_active=True,
            )
            db.add(team)
            db.flush()  # get team.id before adding members

            members = (
                db.query(Employee)
                .filter(Employee.job_title == designation, Employee.is_active == True)
                .all()
            )
            for emp in members:
                db.add(TeamMember(team_id=team.id, employee_id=emp.id))

        db.commit()

        # Report
        teams = db.query(Team).order_by(Team.name).all()
        print(f"Seeded {len(teams)} teams:")
        for t in teams:
            count = db.query(TeamMember).filter(TeamMember.team_id == t.id).count()
            print(f"  {t.name!r:45s}  {count} members")
    finally:
        db.close()


if __name__ == "__main__":
    seed_teams()
