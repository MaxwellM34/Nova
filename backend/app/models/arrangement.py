import enum
from datetime import datetime, date, time
from sqlalchemy import String, DateTime, Enum, Float, Integer, Boolean, ForeignKey, Date, Time, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ArrangementStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"


class ServiceType(str, enum.Enum):
    daytime = "daytime"
    overnight = "overnight"


class PaymentMethod(str, enum.Enum):
    platform = "platform"
    direct = "direct"


class Arrangement(Base):
    __tablename__ = "arrangements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("provider_profiles.id"), index=True)
    status: Mapped[ArrangementStatus] = mapped_column(
        Enum(ArrangementStatus), default=ArrangementStatus.pending
    )
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    days_of_week: Mapped[list | None] = mapped_column(JSON)  # [0,1,2...6]
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    duration_hours: Mapped[int] = mapped_column(Integer)  # 4, 6, 8, 10, 12
    service_type: Mapped[ServiceType] = mapped_column(Enum(ServiceType))
    rate_agreed: Mapped[float] = mapped_column(Float)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod), default=PaymentMethod.platform
    )
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(String(2000))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    family: Mapped["User"] = relationship("User", foreign_keys=[family_id], back_populates="family_arrangements")
    provider: Mapped["ProviderProfile"] = relationship(
        "ProviderProfile", foreign_keys=[provider_id], back_populates="arrangements"
    )
    review: Mapped["Review | None"] = relationship("Review", back_populates="arrangement", uselist=False)
