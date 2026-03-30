from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel, field_validator
from app.models.provider import ProviderType, ProviderStatus, PROVIDER_MIN_RATES


class CertificationBase(BaseModel):
    name: str
    issuing_org: Optional[str] = None
    year_obtained: Optional[int] = None
    expiry_date: Optional[date] = None


class CertificationCreate(CertificationBase):
    pass


class CertificationUpdate(CertificationBase):
    pass


class CertificationOut(CertificationBase):
    id: int
    provider_id: int
    verified_by_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AvailabilityBase(BaseModel):
    day_of_week: Optional[int] = None  # 0-6, None for one-off
    specific_date: Optional[date] = None
    start_time: time
    end_time: time

    @field_validator("day_of_week")
    @classmethod
    def validate_day(cls, v):
        if v is not None and v not in range(7):
            raise ValueError("day_of_week must be 0-6")
        return v


class AvailabilityCreate(AvailabilityBase):
    pass


class AvailabilityOut(AvailabilityBase):
    id: int
    provider_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ProviderProfileBase(BaseModel):
    provider_type: ProviderType
    bio: Optional[str] = None
    years_experience: Optional[int] = None
    hourly_rate: float
    service_area_radius_miles: int = 25

    # Personal info
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    languages_spoken: Optional[str] = None
    has_own_transport: Optional[bool] = None
    special_needs_experience: Optional[bool] = None
    references_available: Optional[bool] = None

    # Emergency contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None

    # Identity
    id_document_type: Optional[str] = None
    id_document_data: Optional[str] = None
    background_check_consent: bool = False

    @field_validator("hourly_rate")
    @classmethod
    def validate_rate(cls, v, info):
        provider_type = info.data.get("provider_type")
        if provider_type and provider_type in PROVIDER_MIN_RATES:
            min_rate = PROVIDER_MIN_RATES[provider_type]
            if v < min_rate:
                raise ValueError(f"Rate must be at least ${min_rate}/hr for {provider_type}")
        return v


class ProviderApply(ProviderProfileBase):
    certifications: Optional[List[CertificationCreate]] = []
    availability: Optional[List[AvailabilityCreate]] = []


class ProviderProfileUpdate(BaseModel):
    bio: Optional[str] = None
    years_experience: Optional[int] = None
    hourly_rate: Optional[float] = None
    service_area_radius_miles: Optional[int] = None
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    languages_spoken: Optional[str] = None
    has_own_transport: Optional[bool] = None
    special_needs_experience: Optional[bool] = None
    references_available: Optional[bool] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    id_document_type: Optional[str] = None
    id_document_data: Optional[str] = None


class ProviderSummary(BaseModel):
    """Compact provider listing for search results."""
    id: int
    user_id: int
    provider_type: ProviderType
    bio: Optional[str]
    years_experience: Optional[int]
    hourly_rate: float
    service_area_radius_miles: int
    status: ProviderStatus
    is_boosted: bool
    avg_rating: Optional[float] = None
    review_count: int = 0
    distance_miles: Optional[float] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

    model_config = {"from_attributes": True}


class ProviderProfileOut(ProviderSummary):
    certifications: List[CertificationOut] = []
    availability: List[AvailabilityOut] = []
    created_at: datetime

    # Personal & safety — included in admin/dashboard views
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    languages_spoken: Optional[str] = None
    has_own_transport: Optional[bool] = None
    special_needs_experience: Optional[bool] = None
    references_available: Optional[bool] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    id_document_type: Optional[str] = None
    id_document_data: Optional[str] = None
    id_verified: bool = False
    background_check_consent: bool = False

    model_config = {"from_attributes": True}
