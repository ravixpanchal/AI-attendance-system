from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginBody(BaseModel):
    username: str
    password: str


class StudentCreate(BaseModel):
    roll_number: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    class_section: str = Field(..., min_length=1, max_length=100)


class StudentOut(BaseModel):
    id: int
    roll_number: str
    name: str
    class_section: str
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentDetailOut(StudentOut):
    attendance_percentage: float
    total_days: int
    present_days: int
    absence_dates: list[date]
    monthly_breakdown: dict[str, Any] | None = None


class AttendanceMarkItem(BaseModel):
    student_id: int
    attendance_date: date
    present: bool


class AttendanceBulkBody(BaseModel):
    marks: list[AttendanceMarkItem]


class AttendanceRecordOut(BaseModel):
    id: int
    student_id: int
    attendance_date: date
    present: bool

    model_config = {"from_attributes": True}


class AttendanceUpdateItem(BaseModel):
    id: int | None = None
    student_id: int | None = None
    attendance_date: date | None = None
    present: bool | None = None


class AnalyticsQuery(BaseModel):
    threshold: float | None = None
    days: int | None = 30
    class_section: str | None = None


class AIQueryBody(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


class AIConfirmBody(BaseModel):
    token: str
    confirm: bool = True


class ExportQuery(BaseModel):
    format: Literal["csv", "xlsx"] = "csv"
    student_id: int | None = None
    class_section: str | None = None
    date_from: date | None = None
    date_to: date | None = None
