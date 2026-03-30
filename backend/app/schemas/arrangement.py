from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel, field_validator
from app.models.arrangement import ArrangementStatus, ServiceType, PaymentMethod

VALID_DURATIONS = {4, 6, 8, 10, 12}


class ArrangementCreate(BaseModel):
    provider_id: int
    start_date: date
    end_date: Optional[date] = None
    recurring: bool = False
    days_of_week: Optional[List[int]] = None
    start_time: time
    end_time: time
    duration_hours: int
    service_type: ServiceType
    rate_agreed: float
    payment_method: PaymentMethod = PaymentMethod.platform
    notes: Optional[str] = None

    @field_validator("duration_hours")
    @classmethod
    def validate_duration(cls, v):
        if v not in VALID_DURATIONS:
            raise ValueError(f"duration_hours must be one of {sorted(VALID_DURATIONS)}")
        return v


class ArrangementUpdate(BaseModel):
    status: Optional[ArrangementStatus] = None
    notes: Optional[str] = None


class ArrangementOut(BaseModel):
    id: int
    family_id: int
    provider_id: int
    status: ArrangementStatus
    start_date: date
    end_date: Optional[date]
    recurring: bool
    days_of_week: Optional[List[int]]
    start_time: time
    end_time: time
    duration_hours: int
    service_type: ServiceType
    rate_agreed: float
    payment_method: PaymentMethod
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
