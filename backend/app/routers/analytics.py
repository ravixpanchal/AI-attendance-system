from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser
from app.services.analytics_service import dashboard_analytics

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("")
def get_analytics(
    threshold: float | None = Query(None),
    trend_days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    return dashboard_analytics(db, threshold=threshold, trend_days=trend_days)
