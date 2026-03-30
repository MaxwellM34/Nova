"""
Arrangement endpoints:
  POST  /arrangements
  GET   /arrangements/me
  PUT   /arrangements/{id}
  POST  /arrangements/{id}/review
  POST  /providers/{id}/schedule-call
  PUT   /calls/{id}
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.middleware.auth import get_current_user, require_family
from app.models.user import User, UserRole
from app.models.provider import ProviderProfile, ProviderAvailability, ProviderStatus
from app.models.arrangement import Arrangement, ArrangementStatus
from app.models.review import Review
from app.models.scheduling import ScheduledCall
from app.schemas.arrangement import ArrangementCreate, ArrangementUpdate, ArrangementOut
from app.schemas.review import ReviewCreate, ReviewOut
from app.schemas.scheduling import ScheduledCallCreate, ScheduledCallUpdate, ScheduledCallOut

router = APIRouter(tags=["arrangements"])


@router.post("/arrangements", response_model=ArrangementOut, status_code=status.HTTP_201_CREATED)
def create_arrangement(
    payload: ArrangementCreate,
    current_user: User = Depends(require_family),
    db: Session = Depends(get_db),
):
    provider = db.query(ProviderProfile).filter(
        ProviderProfile.id == payload.provider_id,
        ProviderProfile.status == ProviderStatus.approved,
    ).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found or not approved")

    arrangement = Arrangement(
        family_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(arrangement)
    db.commit()
    db.refresh(arrangement)
    return arrangement


@router.get("/arrangements/me", response_model=List[ArrangementOut])
def get_my_arrangements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == UserRole.family:
        return (
            db.query(Arrangement)
            .filter(Arrangement.family_id == current_user.id)
            .order_by(Arrangement.start_date.desc())
            .all()
        )
    elif current_user.role == UserRole.provider:
        profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
        if not profile:
            return []
        return (
            db.query(Arrangement)
            .filter(Arrangement.provider_id == profile.id)
            .order_by(Arrangement.start_date.desc())
            .all()
        )
    return []


@router.get("/arrangements/{arrangement_id}", response_model=ArrangementOut)
def get_arrangement(
    arrangement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    arrangement = db.query(Arrangement).filter(Arrangement.id == arrangement_id).first()
    if not arrangement:
        raise HTTPException(status_code=404, detail="Not found")

    # Authorization: family, the provider, or admin
    allowed = current_user.role == UserRole.admin or arrangement.family_id == current_user.id
    if not allowed and current_user.role == UserRole.provider:
        profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
        allowed = profile and profile.id == arrangement.provider_id
    if not allowed:
        raise HTTPException(status_code=403, detail="Access denied")

    return arrangement


@router.put("/arrangements/{arrangement_id}", response_model=ArrangementOut)
def update_arrangement(
    arrangement_id: int,
    payload: ArrangementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    arrangement = db.query(Arrangement).filter(Arrangement.id == arrangement_id).first()
    if not arrangement:
        raise HTTPException(status_code=404, detail="Not found")

    # Determine if user is the provider for this arrangement
    is_provider = False
    if current_user.role == UserRole.provider:
        profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
        is_provider = profile and profile.id == arrangement.provider_id

    is_family = arrangement.family_id == current_user.id
    is_admin = current_user.role == UserRole.admin

    if not (is_family or is_provider or is_admin):
        raise HTTPException(status_code=403, detail="Access denied")

    if payload.status:
        new_status = payload.status
        # Business rules for status transitions
        if new_status == ArrangementStatus.confirmed and not (is_provider or is_admin):
            raise HTTPException(status_code=403, detail="Only provider can confirm arrangements")
        if new_status == ArrangementStatus.completed and not (is_provider or is_admin):
            raise HTTPException(status_code=403, detail="Only provider can mark completed")

        arrangement.status = new_status

        # On confirmation, block provider availability is handled via arrangement records
        # The availability endpoint already subtracts confirmed arrangements

    if payload.notes is not None:
        arrangement.notes = payload.notes

    db.commit()
    db.refresh(arrangement)
    return arrangement


@router.post("/arrangements/{arrangement_id}/review", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def leave_review(
    arrangement_id: int,
    payload: ReviewCreate,
    current_user: User = Depends(require_family),
    db: Session = Depends(get_db),
):
    arrangement = db.query(Arrangement).filter(
        Arrangement.id == arrangement_id,
        Arrangement.family_id == current_user.id,
        Arrangement.status == ArrangementStatus.completed,
    ).first()
    if not arrangement:
        raise HTTPException(status_code=404, detail="Completed arrangement not found")

    existing = db.query(Review).filter(Review.arrangement_id == arrangement_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Review already submitted")

    review = Review(
        arrangement_id=arrangement_id,
        family_id=current_user.id,
        provider_id=arrangement.provider_id,
        **payload.model_dump(),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.post("/providers/{provider_id}/schedule-call", response_model=ScheduledCallOut, status_code=status.HTTP_201_CREATED)
def schedule_call(
    provider_id: int,
    payload: ScheduledCallCreate,
    current_user: User = Depends(require_family),
    db: Session = Depends(get_db),
):
    provider = db.query(ProviderProfile).filter(
        ProviderProfile.id == provider_id,
        ProviderProfile.status == ProviderStatus.approved,
    ).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    call = ScheduledCall(
        family_id=current_user.id,
        provider_id=provider_id,
        **payload.model_dump(),
    )
    db.add(call)
    db.commit()
    db.refresh(call)
    return call


@router.put("/calls/{call_id}", response_model=ScheduledCallOut)
def update_call(
    call_id: int,
    payload: ScheduledCallUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    call = db.query(ScheduledCall).filter(ScheduledCall.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    is_provider = False
    if current_user.role == UserRole.provider:
        profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
        is_provider = profile and profile.id == call.provider_id

    if not (is_provider or call.family_id == current_user.id or current_user.role == UserRole.admin):
        raise HTTPException(status_code=403, detail="Access denied")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(call, field, value)
    db.commit()
    db.refresh(call)
    return call
