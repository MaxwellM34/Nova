from datetime import datetime
from sqlalchemy import DateTime, Integer, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    arrangement_id: Mapped[int] = mapped_column(ForeignKey("arrangements.id"), unique=True, index=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("provider_profiles.id"), index=True)
    rating: Mapped[int] = mapped_column(Integer)  # 1-5
    text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    arrangement: Mapped["Arrangement"] = relationship("Arrangement", back_populates="review")
    family: Mapped["User"] = relationship("User", foreign_keys=[family_id], back_populates="family_reviews")
    provider: Mapped["ProviderProfile"] = relationship(
        "ProviderProfile", foreign_keys=[provider_id], back_populates="reviews"
    )
