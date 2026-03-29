"""Legacy Flask + MySQL prototype (not used by the new FastAPI app). Kept for reference."""
from flask import Flask, request, jsonify
from flask_cors import CORS
from db_config import get_connection

app = Flask(__name__)
CORS(app)


@app.get("/")
def home():
    return jsonify({"message": "Backend is running!", "status": "ok"})


@app.get("/students")
def get_students():
    try:
        db = get_connection()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
        SELECT s.roll, s.name, COALESCE(b.branch, '') AS branch, s.course, s.attendance
        FROM students s
        LEFT JOIN branches b ON s.branch_id = b.id
        ORDER BY s.roll
        """)
        rows = cursor.fetchall()
        cursor.close()
        db.close()
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def ensure_branch_id(db, branch_name):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM branches WHERE branch = %s LIMIT 1", (branch_name,))
    row = cursor.fetchone()
    if row:
        bid = row[0]
        cursor.close()
        return bid
    cursor.execute("INSERT INTO branches (branch) VALUES (%s)", (branch_name,))
    db.commit()
    new_id = cursor.lastrowid
    cursor.close()
    return new_id


@app.post("/students")
def add_student():
    try:
        data = request.json or {}
        for key in ("roll", "name", "course", "attendance"):
            if key not in data:
                return jsonify({"error": f"Missing field: {key}"}), 400

        db = get_connection()
        branch_id = None
        if "branch_id" in data and data["branch_id"] is not None:
            branch_id = data["branch_id"]
        elif "branch" in data and data["branch"]:
            branch_id = ensure_branch_id(db, data["branch"])

        cursor = db.cursor()
        sql = "INSERT INTO students (roll,name,branch_id,course,attendance) VALUES (%s,%s,%s,%s,%s)"
        cursor.execute(sql, (data["roll"], data["name"], branch_id, data["course"], data["attendance"]))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"status": "added"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.put("/students/<roll>")
def update_student(roll):
    try:
        data = request.json or {}
        if not any(k in data for k in ("name", "branch_id", "branch", "course", "attendance")):
            return jsonify({"error": "No updatable fields provided"}), 400

        db = get_connection()
        branch_id = None
        if "branch_id" in data and data["branch_id"] is not None:
            branch_id = data["branch_id"]
        elif "branch" in data and data["branch"]:
            branch_id = ensure_branch_id(db, data["branch"])

        fields = []
        params = []
        if "name" in data:
            fields.append("name=%s")
            params.append(data["name"])
        if branch_id is not None:
            fields.append("branch_id=%s")
            params.append(branch_id)
        if "course" in data:
            fields.append("course=%s")
            params.append(data["course"])
        if "attendance" in data:
            fields.append("attendance=%s")
            params.append(data["attendance"])

        if not fields:
            db.close()
            return jsonify({"error": "No valid fields to update"}), 400

        sql = f"UPDATE students SET {', '.join(fields)} WHERE roll=%s"
        params.append(roll)

        cursor = db.cursor()
        cursor.execute(sql, tuple(params))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"status": "updated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.delete("/students/<roll>")
def delete_student(roll):
    try:
        db = get_connection()
        cursor = db.cursor()
        cursor.execute("DELETE FROM students WHERE roll=%s", (roll,))
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"status": "deleted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
