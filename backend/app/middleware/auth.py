"""
Clerk JWT verification middleware.
Verifies Clerk session tokens on every protected endpoint using Clerk's JWKS.
"""
import httpx
from functools import lru_cache
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole

security = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def _get_jwks() -> dict:
    """Fetch Clerk JWKS. Cached in-process; restart reloads it."""
    resp = httpx.get(settings.CLERK_JWKS_URL, timeout=10)
    resp.raise_for_status()
    return resp.json()


def _verify_clerk_token(token: str) -> dict:
    """Decode and verify a Clerk session JWT. Returns claims dict."""
    try:
        jwks = _get_jwks()
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to reach auth provider: {exc}",
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Auth provider returned error: {exc.response.status_code}",
        )
    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )


def _provision_user_from_clerk(clerk_user_id: str, db: Session) -> User:
    """
    Auto-create a local user record from Clerk's API.
    Used in local dev when the webhook hasn't synced the user yet.
    """
    first_name = None
    last_name = None
    email = None

    if settings.CLERK_SECRET_KEY:
        try:
            resp = httpx.get(
                f"https://api.clerk.com/v1/users/{clerk_user_id}",
                headers={"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"},
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                first_name = data.get("first_name")
                last_name = data.get("last_name")
                emails = data.get("email_addresses", [])
                primary_id = data.get("primary_email_address_id")
                for e in emails:
                    if e.get("id") == primary_id:
                        email = e.get("email_address")
                        break
                if not email and emails:
                    email = emails[0].get("email_address")
                # Role is set via unsafeMetadata on the sign-up form
                role_str = (data.get("unsafe_metadata") or {}).get("role", "family")
                if role_str in UserRole.__members__:
                    role = UserRole(role_str)
                else:
                    role = UserRole.family
        except httpx.RequestError:
            pass

    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found and could not be provisioned. Please try again.",
        )

    from sqlalchemy.exc import IntegrityError
    user = User(
        clerk_user_id=clerk_user_id,
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=role,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to provision user")
        return user
    db.refresh(user)
    return user


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    claims = _verify_clerk_token(credentials.credentials)
    clerk_user_id = claims.get("sub")
    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token claims")

    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if not user:
        user = _provision_user_from_clerk(clerk_user_id, db)
    if user.is_flagged:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account flagged")
    return user


def require_role(*roles: UserRole):
    """Dependency factory: ensures current user has one of the specified roles."""

    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user

    return checker


require_family = require_role(UserRole.family, UserRole.admin)
require_provider = require_role(UserRole.provider, UserRole.admin)
require_admin = require_role(UserRole.admin)
