import enum
from datetime import datetime, date, time
from sqlalchemy import String, DateTime, Enum, Float, Integer, Boolean, ForeignKey, Date, Time, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ProviderType(str, enum.Enum):
    babysitter_nanny = "babysitter_nanny"
    newborn_care_specialist = "newborn_care_specialist"
    postpartum_doula = "postpartum_doula"
    registered_nurse = "registered_nurse"


PROVIDER_MIN_RATES = {
    ProviderType.babysitter_nanny: 35.0,
    ProviderType.newborn_care_specialist: 38.0,
    ProviderType.postpartum_doula: 45.0,
    ProviderType.registered_nurse: 65.0,
}


class ProviderStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class ProviderProfile(Base):
    __tablename__ = "provider_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    provider_type: Mapped[ProviderType] = mapped_column(Enum(ProviderType))
    bio: Mapped[str | None] = mapped_column(Text)
    years_experience: Mapped[int | None] = mapped_column(Integer)
    hourly_rate: Mapped[float] = mapped_column(Float)
    service_area_radius_miles: Mapped[int] = mapped_column(Integer, default=25)
    status: Mapped[ProviderStatus] = mapped_column(Enum(ProviderStatus), default=ProviderStatus.pending)
    is_boosted: Mapped[bool] = mapped_column(Boolean, default=False)
    stripe_connect_account_id: Mapped[str | None] = mapped_column(String(255))
    rejection_reason: Mapped[str | None] = mapped_column(Text)

    # Personal & safety fields
    phone_number: Mapped[str | None] = mapped_column(String(30))
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    languages_spoken: Mapped[str | None] = mapped_column(String(255))
    has_own_transport: Mapped[bool | None] = mapped_column(Boolean)
    special_needs_experience: Mapped[bool | None] = mapped_column(Boolean)
    references_available: Mapped[bool | None] = mapped_column(Boolean)

    # Emergency contact
    emergency_contact_name: Mapped[str | None] = mapped_column(String(255))
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(30))
    emergency_contact_relationship: Mapped[str | None] = mapped_column(String(100))

    # Identity verification
    id_document_type: Mapped[str | None] = mapped_column(String(50))
    id_document_data: Mapped[str | None] = mapped_column(Text)  # base64 data URL
    id_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    background_check_consent: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="provider_profile")
    certifications: Mapped[list["ProviderCertification"]] = relationship(
        "ProviderCertification", back_populates="provider", cascade="all, delete-orphan"
    )
    availability: Mapped[list["ProviderAvailability"]] = relationship(
        "ProviderAvailability", back_populates="provider", cascade="all, delete-orphan"
    )
    arrangements: Mapped[list["Arrangement"]] = relationship(
        "Arrangement", foreign_keys="Arrangement.provider_id", back_populates="provider"
    )
    reviews: Mapped[list["Review"]] = relationship(
        "Review", foreign_keys="Review.provider_id", back_populates="provider"
    )
    scheduled_calls: Mapped[list["ScheduledCall"]] = relationship(
        "ScheduledCall", foreign_keys="ScheduledCall.provider_id", back_populates="provider"
    )


class ProviderCertification(Base):
    __tablename__ = "provider_certifications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("provider_profiles.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    issuing_org: Mapped[str | None] = mapped_column(String(255))
    year_obtained: Mapped[int | None] = mapped_column(Integer)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    verified_by_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    provider: Mapped["ProviderProfile"] = relationship("ProviderProfile", back_populates="certifications")


class ProviderAvailability(Base):
    __tablename__ = "provider_availability"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("provider_profiles.id"), index=True)
    day_of_week: Mapped[int | None] = mapped_column(Integer)  # 0=Monday, 6=Sunday; None for one-offs
    specific_date: Mapped[date | None] = mapped_column(Date)  # For one-off availability
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    provider: Mapped["ProviderProfile"] = relationship("ProviderProfile", back_populates="availability")
