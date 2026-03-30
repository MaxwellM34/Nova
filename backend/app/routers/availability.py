from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_provider
from app.models.user import User
from app.models.provider import ProviderProfile, ProviderAvailability
from app.schemas.provider import AvailabilityCreate, AvailabilityOut

router = APIRouter(prefix="/providers/me/availability", tags=["availability"])


def _get_provider(current_user: User, db: Session) -> ProviderProfile:
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    return profile


@router.post("", response_model=AvailabilityOut, status_code=status.HTTP_201_CREATED)
def add_availability(
    payload: AvailabilityCreate,
    current_user: User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    if payload.day_of_week is None and payload.specific_date is None:
        raise HTTPException(status_code=400, detail="Provide day_of_week or specific_date")
    profile = _get_provider(current_user, db)
    avail = ProviderAvailability(provider_id=profile.id, **payload.model_dump())
    db.add(avail)
    db.commit()
    db.refresh(avail)
    return avail


@router.put("/{avail_id}", response_model=AvailabilityOut)
def update_availability(
    avail_id: int,
    payload: AvailabilityCreate,
    current_user: User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    profile = _get_provider(current_user, db)
    avail = db.query(ProviderAvailability).filter(
        ProviderAvailability.id == avail_id,
        ProviderAvailability.provider_id == profile.id,
    ).first()
    if not avail:
        raise HTTPException(status_code=404, detail="Availability slot not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(avail, field, value)
    db.commit()
    db.refresh(avail)
    return avail


@router.delete("/{avail_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability(
    avail_id: int,
    current_user: User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    profile = _get_provider(current_user, db)
    avail = db.query(ProviderAvailability).filter(
        ProviderAvailability.id == avail_id,
        ProviderAvailability.provider_id == profile.id,
    ).first()
    if not avail:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    db.delete(avail)
    db.commit()
