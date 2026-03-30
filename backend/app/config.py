from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://nova:nova_secret@localhost:5432/nova"
    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_SECRET_KEY: str = ""
    CLERK_WEBHOOK_SECRET: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PLATFORM_FEE_PERCENT: int = 15
    FRONTEND_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"
    CLERK_JWKS_URL: str = "https://api.clerk.dev/v1/jwks"

    class Config:
        env_file = ".env"


settings = Settings()
