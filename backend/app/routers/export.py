import io
from datetime import date

import pandas as pd
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, AttendanceRecord, Student

router = APIRouter(prefix="/export", tags=["export"])


@router.get("")
def export_data(
    format: str = Query("csv", pattern="^(csv|xlsx)$"),
    student_id: int | None = None,
    class_section: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    q = db.query(AttendanceRecord, Student).join(Student, Student.id == AttendanceRecord.student_id)
    if student_id:
        q = q.filter(AttendanceRecord.student_id == student_id)
    if class_section:
        q = q.filter(Student.class_section.ilike(f"%{class_section}%"))
    if date_from:
        q = q.filter(AttendanceRecord.attendance_date >= date_from)
    if date_to:
        q = q.filter(AttendanceRecord.attendance_date <= date_to)
    rows = q.order_by(AttendanceRecord.attendance_date, Student.roll_number).all()
    data = [
        {
            "roll_number": s.roll_number,
            "name": s.name,
            "class_section": s.class_section,
            "date": r.attendance_date.isoformat(),
            "status": "Present" if r.present else "Absent",
        }
        for r, s in rows
    ]
    df = pd.DataFrame(data)
    if format == "csv":
        csv_bytes = df.to_csv(index=False).encode("utf-8")
        return StreamingResponse(
            iter([csv_bytes]),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": 'attachment; filename="attendance_export.csv"'},
        )
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Attendance")
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="attendance_export.xlsx"'},
    )
