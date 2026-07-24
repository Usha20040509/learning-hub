"""Add owner_id to event

Revision ID: 003_add_event_owner
Revises: 002_add_employee_extra_fields
Create Date: 2026-07-24 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_add_event_owner'
down_revision = '002_add_employee_extra_fields'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('events', sa.Column('owner_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'events', 'employees', ['owner_id'], ['id'])

def downgrade() -> None:
    op.drop_constraint(None, 'events', type_='foreignkey')
    op.drop_column('events', 'owner_id')
