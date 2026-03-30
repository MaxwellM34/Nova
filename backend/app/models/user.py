import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Enum, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geography
from app.database import Base


class UserRole(str, enum.Enum):
    family = "family"
    provider = "provider"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    clerk_user_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    first_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.family)
    location: Mapped[object | None] = mapped_column(Geography(geometry_type="POINT", srid=4326))
    address: Mapped[str | None] = mapped_column(String(500))
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(50))
    zip_code: Mapped[str | None] = mapped_column(String(20))
    is_flagged: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    provider_profile: Mapped["ProviderProfile | None"] = relationship(
        "ProviderProfile", back_populates="user", uselist=False
    )
    family_arrangements: Mapped[list["Arrangement"]] = relationship(
        "Arrangement", foreign_keys="Arrangement.family_id", back_populates="family"
    )
    family_reviews: Mapped[list["Review"]] = relationship(
        "Review", foreign_keys="Review.family_id", back_populates="family"
    )
    subscriptions: Mapped[list["Subscription"]] = relationship(
        "Subscription", back_populates="user"
    )
    scheduled_calls_as_family: Mapped[list["ScheduledCall"]] = relationship(
        "ScheduledCall", foreign_keys="ScheduledCall.family_id", back_populates="family"
    )
