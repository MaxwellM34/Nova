from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://nova:nova_secret@localhost:5433/nova"
    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_SECRET_KEY: str = ""
    CLERK_WEBHOOK_SECRET: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PLATFORM_FEE_PERCENT: int = 15
    STRIPE_PRICE_FAMILY_BASIC: str = ""
    STRIPE_PRICE_PROVIDER_BASIC: str = ""
    STRIPE_PRICE_PROVIDER_BOOSTED: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"
    CLERK_JWKS_URL: str = ""

    @model_validator(mode="after")
    def derive_jwks_url(self):
        if not self.CLERK_JWKS_URL and self.CLERK_PUBLISHABLE_KEY:
            # pk_test_<frontend-api-host> or pk_live_<frontend-api-host>
            # Clerk JWKS is at https://<frontend-api>/.well-known/jwks.json
            key = self.CLERK_PUBLISHABLE_KEY
            # Extract the encoded frontend API domain from the publishable key
            # Format: pk_test_BASE64== or pk_live_BASE64==
            import base64
            try:
                prefix = "pk_test_" if key.startswith("pk_test_") else "pk_live_"
                encoded = key[len(prefix):]
                # Pad base64 if needed
                padded = encoded + "=" * (-len(encoded) % 4)
                domain = base64.b64decode(padded).decode("utf-8").rstrip("$")
                self.CLERK_JWKS_URL = f"https://{domain}/.well-known/jwks.json"
            except Exception:
                self.CLERK_JWKS_URL = "https://api.clerk.dev/v1/jwks"
        elif not self.CLERK_JWKS_URL:
            self.CLERK_JWKS_URL = "https://api.clerk.dev/v1/jwks"
        return self

    class Config:
        env_file = ".env"


settings = Settings()
