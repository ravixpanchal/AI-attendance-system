# AI-Based Smart Attendance Management System

Full-stack attendance system for colleges and training institutes: admin-only access, student import (CSV/Excel), date-wise attendance with bulk grid UI, analytics dashboard (Recharts), CSV/XLSX export, and an **AI assistant** that answers natural-language questions and proposes attendance corrections **only after explicit admin confirmation**.

## Stack

| Layer | Technology |
|--------|------------|
| Frontend | React 18 (Vite), TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, SQLAlchemy 2, JWT (admin), pandas/openpyxl |
| Database | **SQLite** by default (zero setup); **PostgreSQL** for production |
| AI | Optional **OpenAI** (`OPENAI_API_KEY`); rule-based fallback always available |

## Project layout

- `backend/` — FastAPI app (`main.py`), models, REST routes, AI service
- `frontend/` — Vite + React SPA
- `database/schema_postgresql.sql` — PostgreSQL DDL (optional if you use Postgres)
- `backend/app_flask_legacy.py` — old Flask/MySQL prototype (reference only)

## Quick start (local)

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
copy .env.example .env          # edit secrets and DATABASE_URL if needed
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Default admin (override in `.env`):

- Username: `admin`
- Password: `admin123`

On first run the API creates tables and seeds the admin user.

**PostgreSQL:** set `DATABASE_URL=postgresql://user:pass@host:5432/dbname` and run `database/schema_postgresql.sql` (or rely on SQLAlchemy `create_all` for a fresh DB).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies API calls to `http://127.0.0.1:8000`.

**Production API URL:** set `VITE_API_URL` in `frontend/.env` to your deployed API (see `.env.example`).

## API overview (authenticated with `Authorization: Bearer <token>`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/login` | Admin login → JWT |
| GET | `/students` | List students |
| GET | `/students/search?q=` | Search |
| GET | `/students/{id}` | Profile + attendance % + absence dates |
| POST | `/students` | Add one student |
| POST | `/upload` | Upload CSV/XLSX roster |
| GET | `/attendance` | Filter attendance records |
| POST | `/attendance` | Bulk mark `{ "marks": [{ student_id, attendance_date, present }] }` |
| PUT | `/attendance/record` | Update one record |
| GET | `/analytics` | Dashboard stats and chart data |
| GET | `/export?format=csv|xlsx&...` | Export with optional filters |
| POST | `/ai/query` or `/ai-query` | AI message → answer or **confirmation token** |
| POST | `/ai/confirm` or `/ai-confirm` | Confirm/cancel pending AI DB changes |

Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## AI behaviour

- **Queries** (percentages, absences, trends, “below 75%”, section reports) are answered from the database.
- **Mutations** (e.g. “mark Ravi present on …”) create a **pending action** and return a token; the UI must call `/ai-confirm` with `confirm: true` to apply changes. Nothing is written without that step.
- With `OPENAI_API_KEY`, the service uses the chat model from `OPENAI_MODEL` for richer interpretation; without it, built-in rules handle common patterns.

## Deployment notes

- **Frontend (Vercel):** build command `npm run build`, output `frontend/dist`, set `VITE_API_URL` to the API origin.
- **Backend (Render / Railway):** run `uvicorn main:app --host 0.0.0.0 --port $PORT`, set `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`, and admin credentials.
- **Database (Supabase / Neon):** use PostgreSQL URL in `DATABASE_URL` and run `schema_postgresql.sql` once if needed.

## Licence

Educational / project use.
