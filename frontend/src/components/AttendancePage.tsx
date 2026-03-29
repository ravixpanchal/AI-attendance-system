import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Student } from "@/types";
import { Button, Card, Input, Label } from "./ui";

type AttRow = { id: number; student_id: number; attendance_date: string; present: boolean };

export function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Record<number, boolean | undefined>>({});
  const [existing, setExisting] = useState<Record<number, AttRow>>({});
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    api<Student[]>("/students")
      .then(setStudents)
      .catch((e) => setErr(String(e)));
  }, []);

  const d = useMemo(() => date, [date]);

  useEffect(() => {
    if (!d) return;
    setErr("");
    api<AttRow[]>(`/attendance?date_from=${d}&date_to=${d}`)
      .then((list) => {
        const ex: Record<number, AttRow> = {};
        const r: Record<number, boolean | undefined> = {};
        for (const a of list) {
          ex[a.student_id] = a;
          r[a.student_id] = a.present;
        }
        setExisting(ex);
        setRows(r);
      })
      .catch((e) => setErr(String(e)));
  }, [d]);

  function setPresent(sid: number, present: boolean) {
    setRows((prev) => ({ ...prev, [sid]: present }));
  }

  async function saveBulk() {
    setErr("");
    setSaved("");
    const marks = students
      .map((s) => {
        const pr = rows[s.id];
        if (pr === undefined) return null;
        return { student_id: s.id, attendance_date: d, present: pr };
      })
      .filter(Boolean) as { student_id: number; attendance_date: string; present: boolean }[];
    if (!marks.length) {
      setErr("Mark at least one student.");
      return;
    }
    try {
      await api("/attendance", {
        method: "POST",
        body: JSON.stringify({ marks }),
      });
      setSaved("Saved.");
    } catch (e) {
      setErr(String(e));
    }
  }

  return (
    <div className="w-full max-w-5xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Attendance</h1>
        <p className="text-sm text-muted-foreground">Bulk mark present/absent for a date</p>
      </div>

      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full space-y-2 sm:w-auto sm:min-w-[200px]">
          <Label htmlFor="att-date">Date</Label>
          <Input
            id="att-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full sm:max-w-[14rem]"
          />
        </div>
        <Button className="w-full sm:w-auto" type="button" onClick={saveBulk}>
          Save attendance
        </Button>
        {saved && <span className="text-sm text-green-600 dark:text-green-400">{saved}</span>}
      </Card>

      {err && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {err}
        </p>
      )}

      <Card className="overflow-hidden p-0">
        <div className="-mx-px overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-muted-foreground">
                <th className="p-3">Roll</th>
                <th className="p-3">Name</th>
                <th className="p-3">Class</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const v = rows[s.id];
                return (
                  <tr key={s.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">{s.roll_number}</td>
                    <td className="p-3">{s.name}</td>
                    <td className="p-3">{s.class_section}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={v === true ? "default" : "outline"}
                          type="button"
                          className="!min-h-10 px-3 py-2 text-xs sm:!min-h-9 sm:text-sm"
                          onClick={() => setPresent(s.id, true)}
                        >
                          Present
                        </Button>
                        <Button
                          variant={v === false ? "destructive" : "outline"}
                          type="button"
                          className="!min-h-10 px-3 py-2 text-xs sm:!min-h-9 sm:text-sm"
                          onClick={() => setPresent(s.id, false)}
                        >
                          Absent
                        </Button>
                        {existing[s.id] && <span className="text-xs text-muted-foreground self-center">saved</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
