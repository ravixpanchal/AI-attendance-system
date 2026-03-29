# AI-Based Smart Attendance Management System

Full-stack attendance system for colleges and training institutes designed to replace messy paper trails with a slick, digital workflow. It features admin-only access, bulk student import (CSV/Excel), date-wise attendance with a modern grid UI, an analytics dashboard, and a powerful **AI assistant** that answers natural-language questions and proposes attendance corrections instantly.

## Why do we need this?? What is the actual problem??

In most educational institutions, tracking daily attendance using traditional paper registers or basic spreadsheets is incredibly slow and error-prone. 
* It takes immense administrative overhead to manually calculate monthly snapshots or compute trends.
* Identifying at-risk students (e.g., catching who falls below the mandatory 75% attendance threshold) is often delayed until the end of the semester when it's too late to intervene.
* Teachers waste valuable classroom time managing complex records instead of teaching.

## How can we solve the problem with this project??

This project solves the problem by fully digitizing and automating the tracking workflow:
1. **Bulk Grid Operations:** Teachers and admins can mark an entire class's attendance in seconds using a responsive, modern grid interface.
2. **Instant AI Analytics:** We integrated an AI Assistant directly into the database engine. Instead of manually crunching numbers or filtering spreadsheets, admins can simply ask questions in plain English (e.g., *"Generate report for section A"* or *"Who is below 75%?"*). The system instantly calculates the exact figures based on real-time data.

## AI Assistant Capabilities

The AI Assistant understands specific keyword rules to fetch real-time data seamlessly. It correctly answers these types of questions:
1. **Modifying Attendance:** *"Mark Ravi present on 2026-03-29"* (Always requires explicit confirmation)
2. **Students Below Threshold:** *"Who is below 75 percent?"* 
3. **Attendance Trends:** *"Show me the trend for last 30 days"*
4. **Frequent Absentees:** *"Who is often absent?"*
5. **Section-Wide Reports:** *"Generate report for section A"*
6. **Individual Student Percentage:** *"Attendance percentage for Ravi"*
7. **Absence Checking:** *"When was Anurag absent?"*

> **Future Scope:** In the future, we will add real-time AI (after model training) that will be able to handle and give answers to *all* types of generic and complex queries smoothly!

## Which technologies are used in this project??

| Layer | Technology |
|--------|------------|
| **Frontend** | React 18 (Vite), TypeScript, Tailwind CSS, Recharts |
| **Backend** | FastAPI, SQLAlchemy 2, JWT Authentication, pandas/openpyxl |
| **Database** | SQLite (default/zero setup); PostgreSQL (for production) |
| **AI** | Optional OpenAI (`OPENAI_API_KEY`); Custom highly-optimized Rule-Based SQL Fallback |

## How to run this project??

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate         # Windows
# source .venv/bin/activate      # macOS/Linux

pip install -r requirements.txt
copy .env.example .env           # edit secrets if needed
uvicorn main:app --reload --host 127.0.0.1 --port 8765
```

Default admin credentials (can override in `.env`):
- Username: `admin`
- Password: `admin123`

### 2. Frontend Setup

Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies API calls to your backend automatically.

## How can you use this project??

1. Log into the web portal as the Administrator.
2. Easily import your entire school's roster via a CSV or Excel upload.
3. Every day, use the Bulk Attendance screen to quickly check off who is present or absent.
4. Navigate to the AI Assistant tab and type in natural language queries whenever you need an attendance report, trend analysis, or want to instantly find poorly performing students without diving into the raw data yourself!

---
## Contact Support
If you have any kind of doubt, feel free to reach out me! 
**My mail is :-** [ravi.panchal.kaithi@gmail.com](mailto:ravi.panchal.kaithi@gmail.com)
