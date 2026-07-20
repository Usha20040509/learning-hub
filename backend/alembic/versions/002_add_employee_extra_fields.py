"""Add group_name, years_experience, work_location to employees

Revision ID: 002_add_employee_extra_fields
Revises: 001_initial_schema
Create Date: 2026-07-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "002_add_employee_extra_fields"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("employees") as batch_op:
        batch_op.add_column(sa.Column("group_name", sa.String(length=150), nullable=True))
        batch_op.add_column(sa.Column("years_experience", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("work_location", sa.String(length=150), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("employees") as batch_op:
        batch_op.drop_column("work_location")
        batch_op.drop_column("years_experience")
        batch_op.drop_column("group_name")
