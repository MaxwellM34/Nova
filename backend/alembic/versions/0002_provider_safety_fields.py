"""Add provider safety and identity fields

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("provider_profiles", sa.Column("phone_number", sa.String(30), nullable=True))
    op.add_column("provider_profiles", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("provider_profiles", sa.Column("languages_spoken", sa.String(255), nullable=True))
    op.add_column("provider_profiles", sa.Column("has_own_transport", sa.Boolean(), nullable=True))
    op.add_column("provider_profiles", sa.Column("special_needs_experience", sa.Boolean(), nullable=True))
    op.add_column("provider_profiles", sa.Column("references_available", sa.Boolean(), nullable=True))
    op.add_column("provider_profiles", sa.Column("emergency_contact_name", sa.String(255), nullable=True))
    op.add_column("provider_profiles", sa.Column("emergency_contact_phone", sa.String(30), nullable=True))
    op.add_column("provider_profiles", sa.Column("emergency_contact_relationship", sa.String(100), nullable=True))
    op.add_column("provider_profiles", sa.Column("id_document_type", sa.String(50), nullable=True))
    op.add_column("provider_profiles", sa.Column("id_document_data", sa.Text(), nullable=True))
    op.add_column("provider_profiles", sa.Column("id_verified", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("provider_profiles", sa.Column("background_check_consent", sa.Boolean(), nullable=False, server_default="false"))


def downgrade() -> None:
    for col in [
        "phone_number", "date_of_birth", "languages_spoken", "has_own_transport",
        "special_needs_experience", "references_available", "emergency_contact_name",
        "emergency_contact_phone", "emergency_contact_relationship", "id_document_type",
        "id_document_data", "id_verified", "background_check_consent",
    ]:
        op.drop_column("provider_profiles", col)
