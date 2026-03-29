from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, AttendanceRecord, Student
from app.schemas import AttendanceBulkBody, AttendanceRecordOut, AttendanceUpdateItem

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.get("", response_model=list[AttendanceRecordOut])
def list_attendance(
    student_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    class_section: str | None = None,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    q = db.query(AttendanceRecord)
    if student_id:
        q = q.filter(AttendanceRecord.student_id == student_id)
    if date_from:
        q = q.filter(AttendanceRecord.attendance_date >= date_from)
    if date_to:
        q = q.filter(AttendanceRecord.attendance_date <= date_to)
    if class_section:
        q = q.join(Student).filter(Student.class_section.ilike(f"%{class_section}%"))
    return q.order_by(AttendanceRecord.attendance_date.desc(), AttendanceRecord.student_id).limit(5000).all()


@router.post("", response_model=list[AttendanceRecordOut])
def bulk_mark(
    body: AttendanceBulkBody,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    out: list[AttendanceRecord] = []
    for m in body.marks:
        st = db.query(Student).filter(Student.id == m.student_id).first()
        if not st:
            continue
        existing = (
            db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.student_id == m.student_id,
                AttendanceRecord.attendance_date == m.attendance_date,
            )
            .first()
        )
        if existing:
            existing.present = m.present
            out.append(existing)
        else:
            row = AttendanceRecord(student_id=m.student_id, attendance_date=m.attendance_date, present=m.present)
            db.add(row)
            out.append(row)
    db.commit()
    for r in out:
        db.refresh(r)
    return out


@router.put("/record")
def update_record(
    body: AttendanceUpdateItem,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    if body.id:
        row = db.query(AttendanceRecord).filter(AttendanceRecord.id == body.id).first()
        if not row:
            raise HTTPException(status_code=404, detail="Record not found")
        if body.present is None:
            raise HTTPException(status_code=400, detail="Field 'present' required")
        row.present = body.present
        db.commit()
        db.refresh(row)
        return AttendanceRecordOut.model_validate(row)
    if body.student_id and body.attendance_date is not None:
        row = (
            db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.student_id == body.student_id,
                AttendanceRecord.attendance_date == body.attendance_date,
            )
            .first()
        )
        if not row:
            raise HTTPException(status_code=404, detail="Record not found")
        if body.present is None:
            raise HTTPException(status_code=400, detail="Field 'present' required")
        row.present = body.present
        db.commit()
        db.refresh(row)
        return AttendanceRecordOut.model_validate(row)
    raise HTTPException(status_code=400, detail="Provide id or student_id+attendance_date")
