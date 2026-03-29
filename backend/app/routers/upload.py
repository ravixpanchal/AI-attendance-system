import io
from typing import Any

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, Student

router = APIRouter(tags=["upload"])


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame | None:
    cols = {c.lower().strip(): c for c in df.columns}
    name_col = next(
        (cols[k] for k in cols if k in ("name", "student name", "student_name", "full name")),
        None,
    )
    roll_col = next(
        (cols[k] for k in cols if k in ("roll", "roll number", "roll_number", "roll no", "id")),
        None,
    )
    class_col = next(
        (cols[k] for k in cols if k in ("class", "section", "class section", "class_section", "class/section")),
        None,
    )
    if not name_col or not roll_col or not class_col:
        return None
    out = pd.DataFrame(
        {
            "name": df[name_col].astype(str).str.strip(),
            "roll_number": df[roll_col].astype(str).str.strip(),
            "class_section": df[class_col].astype(str).str.strip(),
        }
    )
    return out


@router.post("/upload")
def upload_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    raw = file.file.read()
    name = (file.filename or "").lower()
    try:
        if name.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(raw))
        elif name.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(raw))
        else:
            raise HTTPException(status_code=400, detail="Upload CSV or Excel (.xlsx)")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {e}")

    norm = _normalize_columns(df)
    if norm is None:
        raise HTTPException(
            status_code=400,
            detail="Required columns: Student Name, Roll Number, Class/Section (flexible header names).",
        )

    inserted = 0
    skipped_duplicate = 0
    errors: list[str] = []
    for _, row in norm.iterrows():
        rn = row["roll_number"]
        nm = row["name"]
        cs = row["class_section"]
        if not rn or rn.lower() == "nan" or not nm or nm.lower() == "nan":
            errors.append(f"Invalid row: {dict(row)}")
            continue
        exists = db.query(Student).filter(Student.roll_number == rn).first()
        if exists:
            skipped_duplicate += 1
            continue
        db.add(Student(roll_number=rn, name=nm, class_section=cs or "General"))
        inserted += 1
    db.commit()
    return {
        "inserted": inserted,
        "skipped_duplicate": skipped_duplicate,
        "errors": errors[:20],
    }
