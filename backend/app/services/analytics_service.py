from collections import defaultdict
from datetime import date, timedelta
from typing import Any

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.config import settings
from app.models import AttendanceRecord, Student


def student_attendance_stats(
    db: Session,
    student_id: int,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict[str, Any]:
    q = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id)
    if date_from:
        q = q.filter(AttendanceRecord.attendance_date >= date_from)
    if date_to:
        q = q.filter(AttendanceRecord.attendance_date <= date_to)
    rows = q.all()
    total = len(rows)
    present = sum(1 for r in rows if r.present)
    pct = (present / total * 100.0) if total else 0.0
    absence_dates = sorted([r.attendance_date for r in rows if not r.present])
    # Monthly breakdown
    monthly: dict[str, dict[str, int]] = defaultdict(lambda: {"present": 0, "absent": 0})
    for r in rows:
        key = r.attendance_date.strftime("%Y-%m")
        if r.present:
            monthly[key]["present"] += 1
        else:
            monthly[key]["absent"] += 1
    return {
        "attendance_percentage": round(pct, 2),
        "total_days": total,
        "present_days": present,
        "absence_dates": absence_dates,
        "monthly_breakdown": dict(monthly),
    }


def dashboard_analytics(db: Session, threshold: float | None = None, trend_days: int = 30) -> dict[str, Any]:
    thr = threshold if threshold is not None else settings.attendance_threshold_pct
    total_students = db.query(func.count(Student.id)).scalar() or 0

    # Per-student percentage (all time)
    students = db.query(Student).all()
    pcts: list[float] = []
    below: list[dict[str, Any]] = []
    for s in students:
        st = student_attendance_stats(db, s.id)
        pcts.append(st["attendance_percentage"])
        if st["total_days"] > 0 and st["attendance_percentage"] < thr:
            below.append(
                {
                    "student_id": s.id,
                    "name": s.name,
                    "roll_number": s.roll_number,
                    "class_section": s.class_section,
                    "attendance_percentage": st["attendance_percentage"],
                }
            )

    avg_pct = round(sum(pcts) / len(pcts), 2) if pcts else 0.0

    end = date.today()
    start_trend = end - timedelta(days=trend_days - 1)
    daily_rows = (
        db.query(
            AttendanceRecord.attendance_date,
            func.sum(case((AttendanceRecord.present.is_(True), 1), else_=0)).label("present_ct"),
            func.count(AttendanceRecord.id).label("total_ct"),
        )
        .filter(AttendanceRecord.attendance_date >= start_trend, AttendanceRecord.attendance_date <= end)
        .group_by(AttendanceRecord.attendance_date)
        .order_by(AttendanceRecord.attendance_date)
        .all()
    )
    daily_trend = [
        {
            "date": str(r.attendance_date),
            "present": int(r.present_ct or 0),
            "absent": int((r.total_ct or 0) - (r.present_ct or 0)),
            "rate": round((r.present_ct or 0) / r.total_ct * 100, 2) if r.total_ct else 0,
        }
        for r in daily_rows
    ]

    present_total = db.query(func.count(AttendanceRecord.id)).filter(AttendanceRecord.present.is_(True)).scalar() or 0
    absent_total = db.query(func.count(AttendanceRecord.id)).filter(AttendanceRecord.present.is_(False)).scalar() or 0

    # Bar chart: student-wise performance (top 15 by volume)
    perf = []
    for s in students:
        st = student_attendance_stats(db, s.id)
        if st["total_days"]:
            perf.append(
                {
                    "name": s.name,
                    "roll_number": s.roll_number,
                    "percentage": st["attendance_percentage"],
                }
            )
    perf.sort(key=lambda x: x["percentage"])
    at_risk = [p for p in perf if p["percentage"] < thr]

    return {
        "total_students": total_students,
        "average_attendance_percentage": avg_pct,
        "threshold_percent": thr,
        "students_below_threshold": below,
        "students_below_threshold_count": len(below),
        "daily_trend": daily_trend,
        "present_vs_absent": {"present": present_total, "absent": absent_total},
        "student_performance": perf[:25],
        "students_at_risk": at_risk[:50],
    }
