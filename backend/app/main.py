from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    webhooks,
    providers,
    certifications,
    availability,
    arrangements,
    admin,
    payments,
    users,
)

app = FastAPI(
    title="Nova API",
    description="Overnight newborn care marketplace for the DC/MD/VA area",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhooks.router)
app.include_router(users.router)
app.include_router(providers.router)
app.include_router(certifications.router)
app.include_router(availability.router)
app.include_router(arrangements.router)
app.include_router(admin.router)
app.include_router(payments.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "nova-api"}
