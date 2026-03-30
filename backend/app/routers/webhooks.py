"""
Clerk webhook handler.
Syncs user.created / user.updated / user.deleted events to the local Users table.
"""
import json
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from svix.webhooks import Webhook, WebhookVerificationError

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/clerk")
async def clerk_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    headers = dict(request.headers)

    if not settings.CLERK_WEBHOOK_SECRET:
        raise HTTPException(status_code=400, detail="Webhook secret not configured")

    try:
        wh = Webhook(settings.CLERK_WEBHOOK_SECRET)
        event = wh.verify(payload, headers)
    except (WebhookVerificationError, ValueError, RuntimeError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event.get("type")
    data = event.get("data", {})

    if event_type == "user.created":
        clerk_id = data["id"]
        email = (data.get("email_addresses") or [{}])[0].get("email_address", "")
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        # Role is set via unsafeMetadata on the sign-up form; fall back to public_metadata
        role_str = (
            (data.get("unsafe_metadata") or {}).get("role")
            or (data.get("public_metadata") or {}).get("role", "family")
        )
        role = UserRole(role_str) if role_str in UserRole.__members__.values() else UserRole.family

        existing = db.query(User).filter(User.clerk_user_id == clerk_id).first()
        if not existing:
            user = User(
                clerk_user_id=clerk_id,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
            )
            db.add(user)
            db.commit()

    elif event_type == "user.updated":
        clerk_id = data["id"]
        user = db.query(User).filter(User.clerk_user_id == clerk_id).first()
        if user:
            email_objs = data.get("email_addresses") or []
            if email_objs:
                user.email = email_objs[0].get("email_address", user.email)
            user.first_name = data.get("first_name", user.first_name)
            user.last_name = data.get("last_name", user.last_name)
            db.commit()

    elif event_type == "user.deleted":
        clerk_id = data["id"]
        user = db.query(User).filter(User.clerk_user_id == clerk_id).first()
        if user:
            db.delete(user)
            db.commit()

    return {"status": "ok"}
