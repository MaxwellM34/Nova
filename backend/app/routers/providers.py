"""
Provider endpoints:
  POST   /providers/apply
  GET    /providers               (public browse with filters)
  GET    /providers/{id}          (full profile)
  PUT    /providers/me
  GET    /providers/me/dashboard
  GET    /providers/{id}/availability
  GET    /providers/{id}/reviews
"""
from typing import Optional, List
from datetime import date, time
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Float, case, desc, and_, or_
from geoalchemy2.functions import ST_DWithin, ST_Distance, ST_MakePoint, ST_SetSRID

from app.database import get_db
from app.middleware.auth import get_current_user, require_provider
from app.models.user import User, UserRole
from app.models.provider import ProviderProfile, ProviderStatus, ProviderCertification, ProviderAvailability
from app.models.arrangement import Arrangement, ArrangementStatus
from app.models.review import Review
from app.schemas.provider import (
    ProviderApply,
    ProviderProfileUpdate,
    ProviderProfileOut,
    ProviderSummary,
    CertificationOut,
    AvailabilityOut,
)
from app.schemas.review import ReviewOut

router = APIRouter(prefix="/providers", tags=["providers"])

MILES_TO_METERS = 1609.344


def _avg_rating(db: Session, provider_id: int) -> Optional[float]:
    result = db.query(func.avg(Review.rating)).filter(Review.provider_id == provider_id).scalar()
    return round(float(result), 2) if result else None


def _review_count(db: Session, provider_id: int) -> int:
    return db.query(func.count(Review.id)).filter(Review.provider_id == provider_id).scalar() or 0


def _build_provider_out(provider: ProviderProfile, db: Session, distance_miles: Optional[float] = None) -> dict:
    return {
        **{c.name: getattr(provider, c.name) for c in provider.__table__.columns},
        "first_name": provider.user.first_name,
        "last_name": provider.user.last_name,
        "city": provider.user.city,
        "state": provider.user.state,
        "avg_rating": _avg_rating(db, provider.id),
        "review_count": _review_count(db, provider.id),
        "distance_miles": distance_miles,
        "certifications": provider.certifications,
        "availability": provider.availability,
    }


@router.post("/apply", status_code=status.HTTP_201_CREATED)
def apply_as_provider(
    payload: ProviderApply,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only provider accounts can apply")
    existing = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Provider profile already exists")

    profile = ProviderProfile(
        user_id=current_user.id,
        status=ProviderStatus.pending,
        **{
            k: v for k, v in payload.model_dump(
                exclude={"certifications", "availability"}
            ).items()
            if v is not None
        },
    )
    db.add(profile)
    db.flush()

    for cert in (payload.certifications or []):
        db.add(ProviderCertification(provider_id=profile.id, **cert.model_dump()))

    for avail in (payload.availability or []):
        db.add(ProviderAvailability(provider_id=profile.id, **avail.model_dump()))

    db.commit()
    db.refresh(profile)
    return {"id": profile.id, "status": profile.status}


@router.get("", response_model=List[ProviderSummary])
def browse_providers(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    distance_miles: Optional[int] = Query(None, ge=1, le=100),
    provider_type: Optional[str] = Query(None),
    min_rate: Optional[float] = Query(None),
    max_rate: Optional[float] = Query(None),
    availability_date: Optional[date] = Query(None),
    availability_day: Optional[int] = Query(None, ge=0, le=6),
    availability_time: Optional[time] = Query(None),
    duration_hours: Optional[int] = Query(None),
    service_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = (
        db.query(ProviderProfile)
        .join(User, ProviderProfile.user_id == User.id)
        .filter(ProviderProfile.status == ProviderStatus.approved)
    )

    if provider_type:
        query = query.filter(ProviderProfile.provider_type == provider_type)
    if min_rate is not None:
        query = query.filter(ProviderProfile.hourly_rate >= min_rate)
    if max_rate is not None:
        query = query.filter(ProviderProfile.hourly_rate <= max_rate)

    # Availability filter
    if availability_date or availability_day is not None:
        avail_query = db.query(ProviderAvailability.provider_id)
        if availability_date:
            day_of_week = availability_date.weekday()
            avail_query = avail_query.filter(
                or_(
                    ProviderAvailability.day_of_week == day_of_week,
                    ProviderAvailability.specific_date == availability_date,
                )
            )
        elif availability_day is not None:
            avail_query = avail_query.filter(ProviderAvailability.day_of_week == availability_day)

        if availability_time and duration_hours:
            # Ensure the availability window covers the requested block
            from datetime import datetime, timedelta
            end_t = (datetime.combine(date.today(), availability_time) + timedelta(hours=duration_hours)).time()
            avail_query = avail_query.filter(
                ProviderAvailability.start_time <= availability_time,
                ProviderAvailability.end_time >= end_t,
            )

        available_ids = [r[0] for r in avail_query.all()]
        query = query.filter(ProviderProfile.id.in_(available_ids))

    providers = query.all()

    # Distance sort (in-Python to avoid complexity; small MVP dataset)
    results = []
    for p in providers:
        distance = None
        if lat and lng and p.user.location is not None:
            # Parse WKB point
            from geoalchemy2.shape import to_shape
            pt = to_shape(p.user.location)
            # Approx distance in miles using Haversine-ish via degrees
            dlat = abs(pt.y - lat)
            dlng = abs(pt.x - lng)
            # Rough miles conversion
            distance = ((dlat * 69) ** 2 + (dlng * 54.6) ** 2) ** 0.5

        if distance_miles and distance and distance > distance_miles:
            continue

        results.append((p, distance))

    # Sort: boosted first within distance bracket, then by distance
    results.sort(key=lambda x: (not x[0].is_boosted, x[1] if x[1] is not None else 9999))

    # Paginate
    offset = (page - 1) * page_size
    results = results[offset : offset + page_size]

    return [
        ProviderSummary(**_build_provider_out(p, db, d))
        for p, d in results
    ]


@router.get("/me/dashboard")
def provider_dashboard(
    current_user: User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    arrangements = (
        db.query(Arrangement)
        .filter(Arrangement.provider_id == profile.id)
        .order_by(Arrangement.start_date.desc())
        .all()
    )
    reviews = db.query(Review).filter(Review.provider_id == profile.id).all()

    return {
        "profile": ProviderProfileOut(**_build_provider_out(profile, db)),
        "arrangements": arrangements,
        "reviews": reviews,
        "avg_rating": _avg_rating(db, profile.id),
        "review_count": _review_count(db, profile.id),
    }


@router.get("/me", response_model=ProviderProfileOut)
def get_my_profile(
    current_user: User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    return ProviderProfileOut(**_build_provider_out(profile, db))


@router.put("/me")
def update_my_profile(
    payload: ProviderProfileUpdate,
    current_user: User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    updates = payload.model_dump(exclude_none=True)

    # If ID document changes after approval, require re-review
    id_fields = {"id_document_data", "id_document_type"}
    if id_fields & updates.keys() and profile.status == ProviderStatus.approved:
        profile.status = ProviderStatus.pending
        profile.id_verified = False

    for field, value in updates.items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return ProviderProfileOut(**_build_provider_out(profile, db))


@router.get("/{provider_id}", response_model=ProviderProfileOut)
def get_provider(provider_id: int, db: Session = Depends(get_db)):
    profile = db.query(ProviderProfile).filter(
        ProviderProfile.id == provider_id,
        ProviderProfile.status == ProviderStatus.approved,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider not found")
    return ProviderProfileOut(**_build_provider_out(profile, db))


@router.get("/{provider_id}/availability", response_model=List[AvailabilityOut])
def get_provider_availability(
    provider_id: int,
    target_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    """Returns provider availability minus any confirmed arrangements."""
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider not found")

    avail = db.query(ProviderAvailability).filter(
        ProviderAvailability.provider_id == provider_id
    ).all()

    if target_date:
        # Filter to relevant slots and exclude confirmed arrangement blocks
        day_of_week = target_date.weekday()
        avail = [
            a for a in avail
            if a.day_of_week == day_of_week or a.specific_date == target_date
        ]

        confirmed = db.query(Arrangement).filter(
            Arrangement.provider_id == provider_id,
            Arrangement.status == ArrangementStatus.confirmed,
            or_(
                # Non-recurring: only blocks the exact start_date
                and_(
                    Arrangement.recurring == False,
                    Arrangement.start_date == target_date,
                ),
                # Recurring with no end: blocks all matching days indefinitely
                and_(
                    Arrangement.recurring == True,
                    Arrangement.start_date <= target_date,
                    or_(Arrangement.end_date == None, Arrangement.end_date >= target_date),
                ),
                # Recurring with end date
                and_(
                    Arrangement.recurring == True,
                    Arrangement.start_date <= target_date,
                    Arrangement.end_date >= target_date,
                ),
            ),
        ).all()

        from datetime import datetime, timedelta

        def to_minutes(t):
            return t.hour * 60 + t.minute

        def overlaps(slot_start, slot_end, block_start, block_end):
            """Check time overlap, handling overnight slots (end < start crosses midnight)."""
            s0 = to_minutes(slot_start)
            s1 = to_minutes(slot_end) if slot_end > slot_start else to_minutes(slot_end) + 1440
            b0 = to_minutes(block_start)
            b1 = to_minutes(block_end) if block_end > block_start else to_minutes(block_end) + 1440
            return s0 < b1 and s1 > b0

        blocked_times = [(a.start_time, a.end_time) for a in confirmed]
        avail = [
            a for a in avail
            if not any(overlaps(a.start_time, a.end_time, bt[0], bt[1]) for bt in blocked_times)
        ]

    return avail


@router.get("/{provider_id}/reviews", response_model=List[ReviewOut])
def get_provider_reviews(provider_id: int, db: Session = Depends(get_db)):
    return db.query(Review).filter(Review.provider_id == provider_id).order_by(Review.created_at.desc()).all()
