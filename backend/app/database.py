from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from sqlalchemy.pool import NullPool
from app.config import settings


class Base(DeclarativeBase):
    pass


def _make_engine():
    return create_engine(
        settings.DATABASE_URL,
        poolclass=NullPool if settings.ENVIRONMENT == "test" else None,
    )


# Lazy singletons — created on first access, not at import time.
_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = _make_engine()
    return _engine


def get_session_factory():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal


def get_db():
    db = get_session_factory()()
    try:
        yield db
    finally:
        db.close()
