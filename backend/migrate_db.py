import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from app.database.base import Base
from app.models.employee import Employee
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.training_catalog import TrainingCatalog
from app.models.event import Event
from app.models.event_participant import EventParticipant
from app.models.event_team import EventTeam
from app.config.settings import settings

print("Initializing PostgreSQL Database schema...")
engine_pg = create_engine(settings.database_url)
Base.metadata.create_all(engine_pg)
print("Schema created successfully!")

print("Migrating data from SQLite to PostgreSQL...")
engine_sqlite = create_engine("sqlite:///./app.db")

# A helper to clear tables and reset sequence (identity) columns if needed
def clear_table(sess, table_name):
    sess.execute(text(f"TRUNCATE TABLE {table_name} CASCADE"))
    # Reset sequences if any exist
    try:
        sess.execute(text(f"ALTER SEQUENCE {table_name}_id_seq RESTART WITH 1"))
    except Exception:
        pass # Not all tables have id_seq

with Session(engine_sqlite) as sess_sq, Session(engine_pg) as sess_pg:
    # Employees
    employees = sess_sq.query(Employee).all()
    clear_table(sess_pg, "employees")
    for e in employees:
        sess_pg.merge(e)
    sess_pg.commit()
    print(f"Migrated {len(employees)} employees.")

    # Teams
    teams = sess_sq.query(Team).all()
    clear_table(sess_pg, "teams")
    for t in teams:
        sess_pg.merge(t)
    sess_pg.commit()
    print(f"Migrated {len(teams)} teams.")

    # Team Members
    members = sess_sq.query(TeamMember).all()
    clear_table(sess_pg, "team_members")
    for m in members:
        sess_pg.merge(m)
    sess_pg.commit()
    print(f"Migrated {len(members)} team members.")

    # Training Catalog
    catalog = sess_sq.query(TrainingCatalog).all()
    clear_table(sess_pg, "training_catalog")
    for c in catalog:
        sess_pg.merge(c)
    sess_pg.commit()
    print(f"Migrated {len(catalog)} training catalog items.")

    # Events
    events = sess_sq.query(Event).all()
    clear_table(sess_pg, "events")
    for e in events:
        sess_pg.merge(e)
    sess_pg.commit()
    print(f"Migrated {len(events)} events.")

    # Event Participants
    parts = sess_sq.query(EventParticipant).all()
    clear_table(sess_pg, "event_participants")
    for p in parts:
        sess_pg.merge(p)
    sess_pg.commit()
    print(f"Migrated {len(parts)} event participants.")

    # Event Teams
    eteams = sess_sq.query(EventTeam).all()
    clear_table(sess_pg, "event_teams")
    for et in eteams:
        sess_pg.merge(et)
    sess_pg.commit()
    print(f"Migrated {len(eteams)} event teams.")

    # Reset sequences based on max IDs so new inserts work!
    for table in ["employees", "teams", "training_catalog", "events"]:
        try:
            sess_pg.execute(text(f"SELECT setval('{table}_id_seq', (SELECT MAX(id) FROM {table}))"))
        except Exception:
            pass
    sess_pg.commit()

print("Migration completed successfully!")
