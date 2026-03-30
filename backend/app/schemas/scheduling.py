from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.scheduling import CallType, CallStatus


class ScheduledCallCreate(BaseModel):
    call_type: CallType
    proposed_datetime: datetime
    notes: Optional[str] = None


class ScheduledCallUpdate(BaseModel):
    status: Optional[CallStatus] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None


class ScheduledCallOut(BaseModel):
    id: int
    family_id: int
    provider_id: int
    call_type: CallType
    proposed_datetime: datetime
    status: CallStatus
    meeting_link: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
