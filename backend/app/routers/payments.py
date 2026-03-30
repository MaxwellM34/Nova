"""
Stripe payment endpoints.
"""
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user, require_provider
from app.models.user import User
from app.models.provider import ProviderProfile
from app.models.arrangement import Arrangement
from app.models.subscription import Subscription, PlanType, SubscriptionStatus

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/payments", tags=["payments"])


class SubscriptionCreate(BaseModel):
    plan_type: PlanType
    payment_method_id: str


class PaymentIntentCreate(BaseModel):
    arrangement_id: int


@router.post("/connect-account")
def create_connect_account(
    current_user: User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    """Onboard provider to Stripe Connect."""
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    if profile.stripe_connect_account_id:
        # Return existing onboarding link
        account_id = profile.stripe_connect_account_id
    else:
        account = stripe.Account.create(
            type="express",
            email=current_user.email,
            capabilities={"card_payments": {"requested": True}, "transfers": {"requested": True}},
        )
        profile.stripe_connect_account_id = account.id
        db.commit()
        account_id = account.id

    link = stripe.AccountLink.create(
        account=account_id,
        refresh_url=f"{settings.FRONTEND_URL}/provider/dashboard?stripe=refresh",
        return_url=f"{settings.FRONTEND_URL}/provider/dashboard?stripe=success",
        type="account_onboarding",
    )
    return {"url": link.url}


@router.post("/create-payment-intent")
def create_payment_intent(
    payload: PaymentIntentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe payment intent for an arrangement (platform takes a fee)."""
    arrangement = db.query(Arrangement).filter(
        Arrangement.id == payload.arrangement_id,
        Arrangement.family_id == current_user.id,
    ).first()
    if not arrangement:
        raise HTTPException(status_code=404, detail="Arrangement not found")

    provider_profile = db.query(ProviderProfile).filter(
        ProviderProfile.id == arrangement.provider_id
    ).first()
    if not provider_profile or not provider_profile.stripe_connect_account_id:
        raise HTTPException(status_code=400, detail="Provider has not set up Stripe Connect")

    amount_cents = int(arrangement.rate_agreed * arrangement.duration_hours * 100)
    platform_fee = int(amount_cents * settings.STRIPE_PLATFORM_FEE_PERCENT / 100)

    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency="usd",
        application_fee_amount=platform_fee,
        transfer_data={"destination": provider_profile.stripe_connect_account_id},
        metadata={"arrangement_id": str(arrangement.id)},
    )

    arrangement.stripe_payment_intent_id = intent.id
    db.commit()

    return {"client_secret": intent.client_secret, "amount": amount_cents}


@router.post("/create-subscription")
def create_subscription(
    payload: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update a Stripe subscription."""
    PLAN_PRICE_IDS = {
        PlanType.family_basic: settings.STRIPE_PRICE_FAMILY_BASIC,
        PlanType.provider_basic: settings.STRIPE_PRICE_PROVIDER_BASIC,
        PlanType.provider_boosted: settings.STRIPE_PRICE_PROVIDER_BOOSTED,
    }
    price_id = PLAN_PRICE_IDS.get(payload.plan_type)
    if not price_id:
        raise HTTPException(status_code=400, detail="Invalid plan type")

    # Create or retrieve Stripe customer
    customer = stripe.Customer.create(
        email=current_user.email,
        payment_method=payload.payment_method_id,
        invoice_settings={"default_payment_method": payload.payment_method_id},
        metadata={"user_id": str(current_user.id)},
    )

    subscription = stripe.Subscription.create(
        customer=customer.id,
        items=[{"price": price_id}],
        expand=["latest_invoice.payment_intent"],
    )

    db_sub = Subscription(
        user_id=current_user.id,
        stripe_subscription_id=subscription.id,
        stripe_customer_id=customer.id,
        plan_type=payload.plan_type,
        status=SubscriptionStatus.active,
        current_period_end=None,
    )
    db.add(db_sub)
    db.commit()

    return {
        "subscription_id": subscription.id,
        "status": subscription.status,
        "client_secret": subscription.latest_invoice.payment_intent.client_secret
        if subscription.latest_invoice
        else None,
    }


@router.post("/stripe-webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=400, detail="Stripe webhook secret not configured")
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    if event["type"] == "payment_intent.succeeded":
        pi = event["data"]["object"]
        arrangement_id = int(pi.get("metadata", {}).get("arrangement_id", 0))
        if arrangement_id:
            arrangement = db.query(Arrangement).filter(Arrangement.id == arrangement_id).first()
            if arrangement:
                from app.models.arrangement import ArrangementStatus
                arrangement.status = ArrangementStatus.confirmed
                db.commit()

    elif event["type"] in ("customer.subscription.updated", "customer.subscription.deleted"):
        sub_obj = event["data"]["object"]
        db_sub = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == sub_obj["id"]
        ).first()
        if db_sub:
            db_sub.status = SubscriptionStatus(sub_obj["status"]) if sub_obj["status"] in SubscriptionStatus.__members__.values() else SubscriptionStatus.cancelled
            db.commit()

    return {"status": "ok"}
