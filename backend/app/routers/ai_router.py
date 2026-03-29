from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser
from app.schemas import AIConfirmBody, AIQueryBody
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/query")
async def ai_query(
    body: AIQueryBody,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    result = await ai_service.process_ai_message(db, body.message)
    return result


@router.post("/confirm")
def ai_confirm(
    body: AIConfirmBody,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    return ai_service.confirm_token(db, body.token, body.confirm)
