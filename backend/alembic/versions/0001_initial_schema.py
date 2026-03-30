"""Initial schema with PostGIS

Revision ID: 0001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import geoalchemy2

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("clerk_user_id", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=True),
        sa.Column("last_name", sa.String(100), nullable=True),
        sa.Column(
            "role",
            sa.Enum("family", "provider", "admin", name="userrole"),
            nullable=False,
            server_default="family",
        ),
        sa.Column(
            "location",
            geoalchemy2.types.Geography(geometry_type="POINT", srid=4326),
            nullable=True,
        ),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("state", sa.String(50), nullable=True),
        sa.Column("zip_code", sa.String(20), nullable=True),
        sa.Column("is_flagged", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_clerk_user_id", "users", ["clerk_user_id"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "provider_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "provider_type",
            sa.Enum(
                "babysitter_nanny",
                "newborn_care_specialist",
                "postpartum_doula",
                "registered_nurse",
                name="providertype",
            ),
            nullable=False,
        ),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("years_experience", sa.Integer(), nullable=True),
        sa.Column("hourly_rate", sa.Float(), nullable=False),
        sa.Column("service_area_radius_miles", sa.Integer(), nullable=False, server_default="25"),
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "rejected", name="providerstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("is_boosted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("stripe_connect_account_id", sa.String(255), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_provider_profiles_id", "provider_profiles", ["id"])
    op.create_index("ix_provider_profiles_user_id", "provider_profiles", ["user_id"])

    op.create_table(
        "provider_certifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("provider_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("issuing_org", sa.String(255), nullable=True),
        sa.Column("year_obtained", sa.Integer(), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("verified_by_admin", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["provider_id"], ["provider_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_provider_certifications_id", "provider_certifications", ["id"])
    op.create_index("ix_provider_certifications_provider_id", "provider_certifications", ["provider_id"])

    op.create_table(
        "provider_availability",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("provider_id", sa.Integer(), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=True),
        sa.Column("specific_date", sa.Date(), nullable=True),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["provider_id"], ["provider_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_provider_availability_id", "provider_availability", ["id"])
    op.create_index("ix_provider_availability_provider_id", "provider_availability", ["provider_id"])

    op.create_table(
        "arrangements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("family_id", sa.Integer(), nullable=False),
        sa.Column("provider_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "confirmed", "completed", "cancelled", name="arrangementstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("recurring", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("days_of_week", sa.JSON(), nullable=True),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("duration_hours", sa.Integer(), nullable=False),
        sa.Column(
            "service_type",
            sa.Enum("daytime", "overnight", name="servicetype"),
            nullable=False,
        ),
        sa.Column("rate_agreed", sa.Float(), nullable=False),
        sa.Column(
            "payment_method",
            sa.Enum("platform", "direct", name="paymentmethod"),
            nullable=False,
            server_default="platform",
        ),
        sa.Column("stripe_payment_intent_id", sa.String(255), nullable=True),
        sa.Column("notes", sa.String(2000), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["family_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["provider_id"], ["provider_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_arrangements_id", "arrangements", ["id"])
    op.create_index("ix_arrangements_family_id", "arrangements", ["family_id"])
    op.create_index("ix_arrangements_provider_id", "arrangements", ["provider_id"])

    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("arrangement_id", sa.Integer(), nullable=False),
        sa.Column("family_id", sa.Integer(), nullable=False),
        sa.Column("provider_id", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["arrangement_id"], ["arrangements.id"]),
        sa.ForeignKeyConstraint(["family_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["provider_id"], ["provider_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("arrangement_id"),
    )
    op.create_index("ix_reviews_id", "reviews", ["id"])
    op.create_index("ix_reviews_provider_id", "reviews", ["provider_id"])

    op.create_table(
        "scheduled_calls",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("family_id", sa.Integer(), nullable=False),
        sa.Column("provider_id", sa.Integer(), nullable=False),
        sa.Column(
            "call_type",
            sa.Enum("virtual", "in_person", name="calltype"),
            nullable=False,
        ),
        sa.Column("proposed_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "confirmed", "cancelled", name="callstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("meeting_link", sa.String(500), nullable=True),
        sa.Column("notes", sa.String(1000), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["family_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["provider_id"], ["provider_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_scheduled_calls_id", "scheduled_calls", ["id"])

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=False),
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
        sa.Column(
            "plan_type",
            sa.Enum("family_basic", "provider_basic", "provider_boosted", name="plantype"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("active", "cancelled", "past_due", "trialing", name="subscriptionstatus"),
            nullable=False,
        ),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("stripe_subscription_id"),
    )
    op.create_index("ix_subscriptions_id", "subscriptions", ["id"])
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])


def downgrade() -> None:
    op.drop_table("subscriptions")
    op.drop_table("scheduled_calls")
    op.drop_table("reviews")
    op.drop_table("arrangements")
    op.drop_table("provider_availability")
    op.drop_table("provider_certifications")
    op.drop_table("provider_profiles")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS subscriptionstatus")
    op.execute("DROP TYPE IF EXISTS plantype")
    op.execute("DROP TYPE IF EXISTS callstatus")
    op.execute("DROP TYPE IF EXISTS calltype")
    op.execute("DROP TYPE IF EXISTS paymentmethod")
    op.execute("DROP TYPE IF EXISTS servicetype")
    op.execute("DROP TYPE IF EXISTS arrangementstatus")
    op.execute("DROP TYPE IF EXISTS providerstatus")
    op.execute("DROP TYPE IF EXISTS providertype")
    op.execute("DROP TYPE IF EXISTS userrole")
