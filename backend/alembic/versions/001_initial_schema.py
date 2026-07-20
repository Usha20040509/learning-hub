"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-07-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "employees",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("employee_id", sa.String(length=100), nullable=False),
        sa.Column("first_name", sa.String(length=150), nullable=False),
        sa.Column("last_name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("department", sa.String(length=150), nullable=True),
        sa.Column("job_title", sa.String(length=150), nullable=True),
        sa.Column("manager_id", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_employees_email"), "employees", ["email"], unique=True)
    op.create_index(op.f("ix_employees_employee_id"), "employees", ["employee_id"], unique=True)
    op.create_index(op.f("ix_employees_id"), "employees", ["id"], unique=False)

    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("team_code", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_teams_id"), "teams", ["id"], unique=False)
    op.create_index(op.f("ix_teams_team_code"), "teams", ["team_code"], unique=True)

    op.create_table(
        "training_catalog",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("duration_hours", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_training_catalog_code"), "training_catalog", ["code"], unique=True)
    op.create_index(op.f("ix_training_catalog_id"), "training_catalog", ["id"], unique=False)

    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("start_time", sa.DateTime(), nullable=False),
        sa.Column("end_time", sa.DateTime(), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("training_catalog_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["training_catalog_id"], ["training_catalog.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_events_id"), "events", ["id"], unique=False)

    op.create_table(
        "team_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.Column("employee_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(), nullable=True),
        sa.Column("joined_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_team_members_id"), "team_members", ["id"], unique=False)

    op.create_table(
        "event_participants",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("employee_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"]),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_event_participants_id"), "event_participants", ["id"], unique=False)

    op.create_table(
        "event_teams",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_event_teams_id"), "event_teams", ["id"], unique=False)


def downgrade() -> None:
    op.drop_table("event_teams")
    op.drop_table("event_participants")
    op.drop_table("team_members")
    op.drop_table("events")
    op.drop_table("training_catalog")
    op.drop_table("teams")
    op.drop_table("employees")
