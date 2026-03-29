"""
Hybrid AI: OpenAI structured output when configured; rule-based fallback otherwise.
Mutations never apply without admin confirmation (pending token).
"""
from __future__ import annotations

import json
import re
import secrets
from datetime import date, datetime, timedelta
from typing import Any

from dateutil import parser as date_parser
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session

from app.config import settings
from app.models import AttendanceRecord, PendingAIAction, Student
from app.services import analytics_service

CONFIRM_TTL_MINUTES = 15


def _find_students_by_name(db: Session, fragment: str) -> list[Student]:
    frag = fragment.strip()
    if not frag:
        return []
    like = f"%{frag}%"
    return (
        db.query(Student)
        .filter(or_(Student.name.ilike(like), Student.roll_number.ilike(like)))
        .order_by(Student.name)
        .limit(20)
        .all()
    )


def _parse_date_loose(text: str | None) -> date | None:
    if not text:
        return None
    t = text.strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(t, fmt).date()
        except ValueError:
            continue
    try:
        return date_parser.parse(t, dayfirst=True).date()
    except (ValueError, TypeError, OverflowError):
        return None


def _student_pct(db: Session, student_id: int) -> dict[str, Any]:
    return analytics_service.student_attendance_stats(db, student_id)


def _absence_dates_for_student(db: Session, student_id: int) -> list[date]:
    rows = (
        db.query(AttendanceRecord.attendance_date)
        .filter(AttendanceRecord.student_id == student_id, AttendanceRecord.present.is_(False))
        .order_by(AttendanceRecord.attendance_date)
        .all()
    )
    return [r[0] for r in rows]


def _students_below_threshold(db: Session, threshold: float) -> list[dict[str, Any]]:
    q = (
        db.query(
            Student.id,
            Student.name,
            Student.roll_number,
            Student.class_section,
            func.count(AttendanceRecord.id).label("total_days"),
            func.sum(case((AttendanceRecord.present.is_(True), 1), else_=0)).label("present_days")
        )
        .outerjoin(AttendanceRecord, AttendanceRecord.student_id == Student.id)
        .group_by(Student.id)
        .all()
    )
    out = []
    for r in q:
        total = r.total_days or 0
        if total > 0:
            pres = int(r.present_days or 0)
            pct = round((pres / total) * 100, 2)
            if pct < threshold:
                out.append({
                    "name": r.name,
                    "roll_number": r.roll_number,
                    "class_section": r.class_section,
                    "percentage": pct,
                })
    out.sort(key=lambda x: x["percentage"])
    return out


def _trend_last_days(db: Session, days: int) -> list[dict[str, Any]]:
    end = date.today()
    start = end - timedelta(days=days - 1)
    rows = (
        db.query(
            AttendanceRecord.attendance_date,
            func.sum(case((AttendanceRecord.present.is_(True), 1), else_=0)).label("pres_count"),
            func.count(AttendanceRecord.id).label("total_count"),
        )
        .filter(AttendanceRecord.attendance_date >= start, AttendanceRecord.attendance_date <= end)
        .group_by(AttendanceRecord.attendance_date)
        .order_by(AttendanceRecord.attendance_date)
        .all()
    )
    return [
        {
            "date": str(r.attendance_date),
            "present": int(r.pres_count or 0),
            "absent": int((r.total_count or 0) - (r.pres_count or 0)),
        }
        for r in rows
    ]


def _frequent_absentees(db: Session, top_n: int = 10) -> list[dict[str, Any]]:
    rows = (
        db.query(Student.id, Student.name, Student.roll_number, func.count(AttendanceRecord.id).label("abs"))
        .join(AttendanceRecord, AttendanceRecord.student_id == Student.id)
        .filter(AttendanceRecord.present.is_(False))
        .group_by(Student.id, Student.name, Student.roll_number)
        .order_by(func.count(AttendanceRecord.id).desc())
        .limit(top_n)
        .all()
    )
    return [{"name": r[1], "roll_number": r[2], "absence_count": int(r[3])} for r in rows]


def _report_section(db: Session, section: str) -> dict[str, Any]:
    q = (
        db.query(
            Student.id,
            Student.name,
            Student.roll_number,
            func.count(AttendanceRecord.id).label("total_days"),
            func.sum(case((AttendanceRecord.present.is_(True), 1), else_=0)).label("present_days")
        )
        .outerjoin(AttendanceRecord, AttendanceRecord.student_id == Student.id)
        .filter(Student.class_section.ilike(section.strip()))
        .group_by(Student.id)
        .all()
    )
    if not q:
        return {"summary": f"No students found in section matching '{section}'.", "stats": {}}
    
    pcts = []
    below = []
    for r in q:
        total = r.total_days or 0
        if total > 0:
            pres = int(r.present_days or 0)
            pct = round((pres / total) * 100, 2)
            pcts.append(pct)
            if pct < settings.attendance_threshold_pct:
                below.append({"name": r.name, "roll": r.roll_number})
        else:
            pcts.append(0.0)

    avg = round(sum(pcts) / len(pcts), 2) if pcts else 0.0
    
    summary = (
        f"Section {section}: {len(q)} students, class average attendance {avg}%.\n"
        f"{len(below)} student(s) below {settings.attendance_threshold_pct}%:\n"
    )
    if below:
        summary += "\n".join([f"- {s['name']} ({s['roll']})" for s in below])
        
    return {
        "summary": summary,
        "stats": {
            "student_count": len(q),
            "average_percentage": avg,
            "below_threshold_count": len(below),
            "below_threshold": below,
        },
    }


def _rule_based_answer(db: Session, message: str) -> dict[str, Any]:
    m = message.lower()

    # Mutations: return structured proposal (no DB write)
    if any(
        k in m
        for k in (
            "mark ",
            "correct ",
            "set ",
            "update attendance",
            "make attendance",
        )
    ) and any(k in m for k in ("present", "absent", "attendance")):
        # Try: mark <name> present on <date>
        if "absent" in m:
            pres = False
        elif "present" in m:
            pres = True
        else:
            pres = True
        name_match = re.search(r"mark\s+([A-Za-z][A-Za-z\s'.-]+?)\s+(?:present|absent)", m, re.I)
        if not name_match:
            name_match = re.search(r"([A-Za-z][A-Za-z\s'.-]{2,40})\s+(?:present|absent)", m, re.I)
        name_guess = name_match.group(1).strip() if name_match else ""
        date_match = re.search(
            r"(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+(?:\s+\d{4})?|[A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?|\d{4}-\d{2}-\d{2})",
            message,
        )
        d = _parse_date_loose(date_match.group(0)) if date_match else None
        studs = _find_students_by_name(db, name_guess) if name_guess else []
        if len(studs) == 1 and d:
            action = {
                "type": "mark_attendance",
                "items": [{"student_id": studs[0].id, "attendance_date": d.isoformat(), "present": pres}],
            }
            token = _save_pending(db, action)
            return {
                "kind": "confirmation_required",
                "message": (
                    f"Proposed: set {studs[0].name} ({studs[0].roll_number}) to "
                    f"{'Present' if pres else 'Absent'} on {d.isoformat()}. Confirm?"
                ),
                "pending_token": token,
                "proposed_actions": action,
            }
        if len(studs) > 1:
            return {
                "kind": "answer",
                "message": "Multiple students match. Please specify roll number or a more exact name: "
                + ", ".join(f"{s.name} ({s.roll_number})" for s in studs[:5]),
                "data": None,
            }
        return {
            "kind": "answer",
            "message": "Could not resolve student or date from your instruction. Try: 'Mark Ravi present on 2025-03-10'.",
            "data": None,
        }

    # Queries
    if "below" in m and ("%" in message or "percent" in m):
        num = re.search(r"(\d{1,2}(?:\.\d+)?)", m)
        thr = float(num.group(1)) if num else settings.attendance_threshold_pct
        rows = _students_below_threshold(db, thr)
        lines = [f"- {r['name']} ({r['roll_number']}) — {r['percentage']}%" for r in rows[:40]]
        return {
            "kind": "answer",
            "message": f"Students with attendance below {thr}%:\n" + ("\n".join(lines) if lines else "None recorded."),
            "data": {"students": rows},
        }

    if "trend" in m or "last" in m and "day" in m:
        dm = re.search(r"(\d{1,3})\s*days?", m)
        days = int(dm.group(1)) if dm else 30
        tr = _trend_last_days(db, min(days, 365))
        
        lines = [f"Attendance trend for last {days} days ({len(tr)} days with records):"]
        if tr:
            lines.append("Date       | Present | Absent")
            lines.append("-----------------------------")
            for t in tr:
                lines.append(f"{t['date']} | {str(t['present']).ljust(7)} | {t['absent']}")
        else:
            lines.append("No records found.")
            
        return {
            "kind": "answer",
            "message": "\n".join(lines),
            "data": {"trend": tr},
        }

    if "frequent" in m or "often absent" in m:
        fa = _frequent_absentees(db, 10)
        lines = [f"- {x['name']}: {x['absence_count']} absences" for x in fa]
        return {
            "kind": "answer",
            "message": "Students with most absence records:\n" + "\n".join(lines),
            "data": {"frequent_absentees": fa},
        }

    if "report" in m and "section" in m:
        sm = re.search(r"section\s*([A-Za-z0-9_-]+)", m, re.I)
        sec = sm.group(1) if sm else ""
        rep = _report_section(db, sec)
        return {"kind": "answer", "message": rep["summary"], "data": rep["stats"]}

    if "percentage" in m or "attendance %" in m:
        # extract name-ish
        for s in db.query(Student).all():
            if s.name.lower() in m:
                st = _student_pct(db, s.id)
                return {
                    "kind": "answer",
                    "message": (
                        f"{s.name} ({s.roll_number}): {st['attendance_percentage']}% "
                        f"({st['present_days']}/{st['total_days']} days present)."
                    ),
                    "data": st,
                }
        return {"kind": "answer", "message": "Mention a student name to get attendance percentage.", "data": None}

    if "absent" in m and "when" in m:
        for s in db.query(Student).all():
            if s.name.lower() in m:
                dates = _absence_dates_for_student(db, s.id)
                ds = ", ".join(d.isoformat() for d in dates[-30:]) or "No absence records."
                return {
                    "kind": "answer",
                    "message": f"{s.name} was absent on: {ds}",
                    "data": {"absence_dates": [str(x) for x in dates]},
                }

    return {
        "kind": "answer",
        "message": (
            "Try asking: attendance percentage for a student, who is below 75%, "
            "trend for last 30 days, frequently absent students, or generate report for a section."
        ),
        "data": None,
    }


def _save_pending(db: Session, payload: dict[str, Any]) -> str:
    token = secrets.token_urlsafe(24)
    exp = datetime.now() + timedelta(minutes=CONFIRM_TTL_MINUTES)
    row = PendingAIAction(token=token, payload_json=payload, expires_at=exp)
    db.add(row)
    db.commit()
    return token


def apply_confirmed_actions(db: Session, payload: dict[str, Any]) -> dict[str, Any]:
    typ = payload.get("type")
    items = payload.get("items") or []
    updated = 0
    if typ == "mark_attendance":
        for it in items:
            sid = int(it["student_id"])
            d = date.fromisoformat(it["attendance_date"])
            pr = bool(it["present"])
            existing = (
                db.query(AttendanceRecord)
                .filter(AttendanceRecord.student_id == sid, AttendanceRecord.attendance_date == d)
                .first()
            )
            if existing:
                existing.present = pr
            else:
                db.add(AttendanceRecord(student_id=sid, attendance_date=d, present=pr))
            updated += 1
        db.commit()
        return {"applied": updated, "type": typ}
    if typ == "bulk_section_date":
        section = payload.get("class_section")
        d = date.fromisoformat(payload["attendance_date"])
        present = bool(payload.get("present", True))
        studs = db.query(Student).filter(Student.class_section.ilike(section.strip())).all()
        for s in studs:
            existing = (
                db.query(AttendanceRecord)
                .filter(AttendanceRecord.student_id == s.id, AttendanceRecord.attendance_date == d)
                .first()
            )
            if existing:
                existing.present = present
            else:
                db.add(AttendanceRecord(student_id=s.id, attendance_date=d, present=present))
            updated += 1
        db.commit()
        return {"applied": updated, "type": typ}
    raise ValueError("Unknown action type")


async def _llm_interpret(db: Session, message: str) -> dict[str, Any] | None:
    if not settings.openai_api_key:
        return None
    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        schema_hint = """
Return a single JSON object only:
{
  "intent": "query" | "mutate",
  "reply": "short human-readable answer for queries",
  "mutation": null | {
    "type": "mark_attendance" | "bulk_section_date",
    "items": [ {"student_id": number, "attendance_date": "YYYY-MM-DD", "present": boolean } ],
    "class_section": "string or null",
    "attendance_date": "YYYY-MM-DD or null",
    "present": boolean
  },
  "data": { } 
}
For mutate intent, fill mutation; for query, fill reply and optional data keys.
Today's date (reference): """ + date.today().isoformat()

        sys = (
            "You assist an admin attendance system. Students DB fields: id, roll_number, name, class_section. "
            "Attendance: per student per date present boolean. "
            + schema_hint
        )
        # Provide student names for resolution
        names = db.query(Student.id, Student.name, Student.roll_number, Student.class_section).all()
        roster = [{"id": r[0], "name": r[1], "roll_number": r[2], "class_section": r[3]} for r in names[:500]]

        completion = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": sys + "\nRoster JSON:\n" + json.dumps(roster)},
                {"role": "user", "content": message},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content or "{}"
        return json.loads(raw)
    except Exception:
        return None


async def process_ai_message(db: Session, message: str) -> dict[str, Any]:
    msg = message.strip()
    llm = await _llm_interpret(db, msg)
    if llm and isinstance(llm, dict):
        intent = llm.get("intent")
        if intent == "mutate" and llm.get("mutation"):
            mut = llm["mutation"]
            mtype = mut.get("type")
            if mtype == "mark_attendance" and mut.get("items"):
                token = _save_pending(db, {"type": "mark_attendance", "items": mut["items"]})
                return {
                    "kind": "confirmation_required",
                    "message": "Confirm applying attendance updates from AI interpretation.",
                    "pending_token": token,
                    "proposed_actions": {"type": "mark_attendance", "items": mut["items"]},
                }
            if mtype == "bulk_section_date" and mut.get("class_section") and mut.get("attendance_date"):
                token = _save_pending(
                    db,
                    {
                        "type": "bulk_section_date",
                        "class_section": mut["class_section"],
                        "attendance_date": mut["attendance_date"],
                        "present": mut.get("present", True),
                    },
                )
                return {
                    "kind": "confirmation_required",
                    "message": f"Confirm updating section {mut['class_section']} on {mut['attendance_date']}.",
                    "pending_token": token,
                    "proposed_actions": {
                        "type": "bulk_section_date",
                        "class_section": mut["class_section"],
                        "attendance_date": mut["attendance_date"],
                        "present": mut.get("present", True),
                    },
                }
        if intent == "query":
            return {
                "kind": "answer",
                "message": llm.get("reply") or "OK.",
                "data": llm.get("data"),
            }

    return _rule_based_answer(db, msg)


def confirm_token(db: Session, token: str, confirm: bool) -> dict[str, Any]:
    row = db.query(PendingAIAction).filter(PendingAIAction.token == token).first()
    if not row:
        return {"ok": False, "message": "Invalid or expired token."}
    if row.expires_at.replace(tzinfo=None) < datetime.now():
        db.delete(row)
        db.commit()
        return {"ok": False, "message": "Token expired."}
    if not confirm:
        db.delete(row)
        db.commit()
        return {"ok": True, "message": "Cancelled."}
    try:
        result = apply_confirmed_actions(db, row.payload_json)
        db.delete(row)
        db.commit()
        return {"ok": True, "message": "Changes applied.", "result": result}
    except Exception as e:
        db.rollback()
        return {"ok": False, "message": str(e)}
