from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, Student
from app.schemas import StudentCreate, StudentDetailOut, StudentOut
from app.services import analytics_service

router = APIRouter(prefix="/students", tags=["students"])


@router.get("", response_model=list[StudentOut])
def list_students(
    class_section: str | None = None,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    q = db.query(Student)
    if class_section:
        q = q.filter(Student.class_section.ilike(f"%{class_section}%"))
    return q.order_by(Student.name).all()


@router.get("/search", response_model=list[StudentOut])
def search_students(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    like = f"%{q}%"
    return (
        db.query(Student)
        .filter(
            (Student.name.ilike(like))
            | (Student.roll_number.ilike(like))
            | (Student.class_section.ilike(like))
        )
        .order_by(Student.name)
        .limit(50)
        .all()
    )


@router.get("/{student_id}", response_model=StudentDetailOut)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    st = analytics_service.student_attendance_stats(db, s.id)
    return StudentDetailOut(
        id=s.id,
        roll_number=s.roll_number,
        name=s.name,
        class_section=s.class_section,
        created_at=s.created_at,
        attendance_percentage=st["attendance_percentage"],
        total_days=st["total_days"],
        present_days=st["present_days"],
        absence_dates=st["absence_dates"],
        monthly_breakdown=st.get("monthly_breakdown"),
    )


@router.post("", response_model=StudentOut)
def create_student(
    body: StudentCreate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    exists = db.query(Student).filter(Student.roll_number == body.roll_number.strip()).first()
    if exists:
        raise HTTPException(status_code=400, detail="Duplicate roll number")
    s = Student(
        roll_number=body.roll_number.strip(),
        name=body.name.strip(),
        class_section=body.class_section.strip(),
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(s)
    db.commit()
    return {"ok": True}
