from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class ReviewCreate(BaseModel):
    rating: int
    text: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v):
        if v not in range(1, 6):
            raise ValueError("Rating must be 1-5")
        return v


class ReviewOut(BaseModel):
    id: int
    arrangement_id: int
    family_id: int
    provider_id: int
    rating: int
    text: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
