import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Student, StudentDetail } from "@/types";
import { Button, Card, Input, Label } from "./ui";

export function StudentsPage() {
  const [list, setList] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [roll, setRoll] = useState("");
  const [name, setName] = useState("");
  const [cls, setCls] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    const path = q.trim() ? `/students/search?q=${encodeURIComponent(q.trim())}` : "/students";
    const data = await api<Student[]>(path);
    setList(data);
  }

  useEffect(() => {
    load().catch((e) => setErr(String(e)));
  }, []);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await load();
    } catch (e) {
      setErr(String(e));
    }
  }

  async function openDetail(id: number) {
    setErr("");
    try {
      const d = await api<StudentDetail>(`/students/${id}`);
      setDetail(d);
    } catch (e) {
      setErr(String(e));
    }
  }

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api<Student>("/students", {
        method: "POST",
        body: JSON.stringify({ roll_number: roll, name, class_section: cls }),
      });
      setRoll("");
      setName("");
      setCls("");
      await load();
    } catch (e) {
      setErr(String(e));
    }
  }

  return (
    <div className="w-full max-w-5xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Students</h1>
        <p className="text-sm text-muted-foreground">Search, add, and view profiles</p>
      </div>

      <form
        onSubmit={search}
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="min-w-0 flex-1 space-y-2 sm:min-w-[200px]">
          <Label htmlFor="student-search">Search name / roll / class</Label>
          <Input
            id="student-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Query…"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1 sm:flex-none">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => {
              setQ("");
              load();
            }}
          >
            Clear
          </Button>
        </div>
      </form>

      {err && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {err}
        </p>
      )}

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Card className="max-h-[min(480px,70vh)] overflow-auto p-4">
          <div className="min-w-[520px] sm:min-w-0">
            <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-2">Roll</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Class</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b border-border/60">
                  <td className="py-2 font-mono text-xs">{s.roll_number}</td>
                  <td className="py-2">{s.name}</td>
                  <td className="py-2">{s.class_section}</td>
                  <td className="py-2">
                    <Button variant="ghost" className="text-primary py-1 px-2 h-auto" onClick={() => openDetail(s.id)}>
                      Profile
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="mb-4 font-medium">Add student</h2>
          <form onSubmit={addStudent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-roll">Roll number</Label>
              <Input id="add-roll" value={roll} onChange={(e) => setRoll(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-name">Name</Label>
              <Input id="add-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-class">Class / section</Label>
              <Input id="add-class" value={cls} onChange={(e) => setCls(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              Add
            </Button>
          </form>
        </Card>
      </div>

      {detail && (
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
            <div>
              <h2 className="text-lg font-semibold">{detail.name}</h2>
              <p className="text-sm text-muted-foreground">
                {detail.roll_number} · {detail.class_section}
              </p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" variant="outline" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Attendance %</div>
              <div className="text-2xl font-semibold">{detail.attendance_percentage}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Present / total days</div>
              <div className="text-xl font-medium">
                {detail.present_days} / {detail.total_days}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-muted-foreground text-sm mb-1">Absence dates</div>
            <p className="text-sm">{detail.absence_dates.length ? detail.absence_dates.join(", ") : "—"}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
