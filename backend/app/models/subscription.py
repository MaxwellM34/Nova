import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class PlanType(str, enum.Enum):
    family_basic = "family_basic"
    provider_basic = "provider_basic"
    provider_boosted = "provider_boosted"


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    cancelled = "cancelled"
    past_due = "past_due"
    trialing = "trialing"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    stripe_subscription_id: Mapped[str] = mapped_column(String(255), unique=True)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255))
    plan_type: Mapped[PlanType] = mapped_column(Enum(PlanType))
    status: Mapped[SubscriptionStatus] = mapped_column(Enum(SubscriptionStatus))
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="subscriptions")
