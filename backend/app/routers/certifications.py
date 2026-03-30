from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_provider
from app.models.user import User
from app.models.provider import ProviderProfile, ProviderCertification
from app.schemas.provider import CertificationCreate, CertificationUpdate, CertificationOut

router = APIRouter(prefix="/providers/me/certifications", tags=["certifications"])


def _get_provider(current_user: User, db: Session) -> ProviderProfile:
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    return profile


@router.post("", response_model=CertificationOut, status_code=status.HTTP_201_CREATED)
def add_certification(
    payload: CertificationCreate,
    current_user: User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    profile = _get_provider(current_user, db)
    cert = ProviderCertification(provider_id=profile.id, **payload.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.put("/{cert_id}", response_model=CertificationOut)
def update_certification(
    cert_id: int,
    payload: CertificationUpdate,
    current_user: User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    profile = _get_provider(current_user, db)
    cert = db.query(ProviderCertification).filter(
        ProviderCertification.id == cert_id,
        ProviderCertification.provider_id == profile.id,
    ).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(cert, field, value)
    db.commit()
    db.refresh(cert)
    return cert


@router.delete("/{cert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certification(
    cert_id: int,
    current_user: User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    profile = _get_provider(current_user, db)
    cert = db.query(ProviderCertification).filter(
        ProviderCertification.id == cert_id,
        ProviderCertification.provider_id == profile.id,
    ).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    db.delete(cert)
    db.commit()
