"""
Admin endpoints — all require admin role.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_admin
from app.models.user import User
from app.models.provider import ProviderProfile, ProviderCertification, ProviderStatus
from app.models.arrangement import Arrangement
from app.models.review import Review
from app.schemas.provider import ProviderProfileOut, CertificationOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/providers")
def list_providers(
    status: Optional[str] = Query(None),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(ProviderProfile).join(User, ProviderProfile.user_id == User.id)
    if status:
        q = q.filter(ProviderProfile.status == status)
    return q.order_by(ProviderProfile.created_at.desc()).all()


@router.put("/providers/{provider_id}/approve")
def approve_provider(
    provider_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider not found")
    profile.status = ProviderStatus.approved
    profile.rejection_reason = None
    db.commit()
    return {"status": "approved"}


@router.put("/providers/{provider_id}/reject")
def reject_provider(
    provider_id: int,
    reason: Optional[str] = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider not found")
    profile.status = ProviderStatus.rejected
    profile.rejection_reason = reason
    db.commit()
    return {"status": "rejected"}


@router.get("/certifications")
def list_certifications(
    verified: Optional[bool] = Query(None),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(ProviderCertification)
    if verified is not None:
        q = q.filter(ProviderCertification.verified_by_admin == verified)
    return q.order_by(ProviderCertification.created_at.desc()).all()


@router.put("/certifications/{cert_id}/verify")
def verify_certification(
    cert_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    cert = db.query(ProviderCertification).filter(ProviderCertification.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    cert.verified_by_admin = True
    db.commit()
    return {"status": "verified"}


@router.get("/users")
def list_users(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.put("/users/{user_id}/flag")
def flag_user(
    user_id: int,
    flagged: bool = True,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_flagged = flagged
    db.commit()
    return {"is_flagged": user.is_flagged}


@router.get("/arrangements")
def list_arrangements(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return db.query(Arrangement).order_by(Arrangement.created_at.desc()).all()


@router.delete("/reviews/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(review)
    db.commit()


@router.put("/providers/{provider_id}/boost")
def boost_provider(
    provider_id: int,
    is_boosted: bool = True,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider not found")
    profile.is_boosted = is_boosted
    db.commit()
    return {"is_boosted": profile.is_boosted}
