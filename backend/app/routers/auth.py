from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser
from app.schemas import LoginBody, Token
from app.security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(body: LoginBody, db: Session = Depends(get_db)):
    from app.config import settings

    admin = db.query(AdminUser).filter(AdminUser.username == body.username).first()
    if not admin or not verify_password(body.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(admin.username)
    return Token(access_token=token)


@router.get("/me")
def me(admin: AdminUser = Depends(get_current_admin)):
    return {"username": admin.username, "id": admin.id}
