from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine, get_db
from app.deps import get_current_admin
from app.models import AdminUser
from app.routers import ai_router, analytics, attendance, auth, export, students, upload
from app.schemas import AIConfirmBody, AIQueryBody
from app.security import hash_password
from app.services import ai_service


def seed_admin():
    db = SessionLocal()
    try:
        exists = db.query(AdminUser).filter(AdminUser.username == settings.admin_username).first()
        if not exists:
            db.add(
                AdminUser(
                    username=settings.admin_username,
                    password_hash=hash_password(settings.admin_password),
                )
            )
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_admin()
    yield


app = FastAPI(
    title="AI Smart Attendance API",
    description="REST API for AI-Based Smart Attendance Management System",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers already set their own path prefixes; do not duplicate here.
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(attendance.router)
app.include_router(upload.router)
app.include_router(analytics.router)
app.include_router(export.router)
app.include_router(ai_router.router)


@app.get("/")
def root():
    return {"message": "AI Smart Attendance API", "docs": "/docs", "health": "ok"}


@app.post("/ai-query")
async def ai_query_spec(
    body: AIQueryBody,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    return await ai_service.process_ai_message(db, body.message)


@app.post("/ai-confirm")
def ai_confirm_spec(
    body: AIConfirmBody,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    return ai_service.confirm_token(db, body.token, body.confirm)
