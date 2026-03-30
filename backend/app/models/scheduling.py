import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class CallType(str, enum.Enum):
    virtual = "virtual"
    in_person = "in_person"


class CallStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"


class ScheduledCall(Base):
    __tablename__ = "scheduled_calls"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("provider_profiles.id"), index=True)
    call_type: Mapped[CallType] = mapped_column(Enum(CallType))
    proposed_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[CallStatus] = mapped_column(Enum(CallStatus), default=CallStatus.pending)
    meeting_link: Mapped[str | None] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(String(1000))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    family: Mapped["User"] = relationship(
        "User", foreign_keys=[family_id], back_populates="scheduled_calls_as_family"
    )
    provider: Mapped["ProviderProfile"] = relationship(
        "ProviderProfile", foreign_keys=[provider_id], back_populates="scheduled_calls"
    )
