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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Complete sign-up first.",
        )
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
