import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Analytics } from "@/types";
import { Card } from "./ui";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS = ["#3b82f6", "#f97316"];

export function Dashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<Analytics>("/analytics?trend_days=30")
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, []);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!data) return <p className="text-muted-foreground">Loading analytics…</p>;

  const pie = [
    { name: "Present", value: data.present_vs_absent.present },
    { name: "Absent", value: data.present_vs_absent.absent },
  ];

  return (
    <div className="w-full min-w-0 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview and attendance analytics</p>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total students</div>
          <div className="text-3xl font-semibold mt-1">{data.total_students}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Average attendance</div>
          <div className="text-3xl font-semibold mt-1">{data.average_attendance_percentage}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Below {data.threshold_percent}%</div>
          <div className="text-3xl font-semibold mt-1 text-amber-600">{data.students_below_threshold_count}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Daily records (30d)</div>
          <div className="text-3xl font-semibold mt-1">{data.daily_trend.length}</div>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Card className="h-[min(20rem,50vh)] w-full min-w-0 p-4 sm:h-80">
          <h2 className="mb-4 font-medium">Attendance trend (30 days)</h2>
          <div className="h-[calc(100%-2.5rem)] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.daily_trend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Line type="monotone" dataKey="present" stroke="#3b82f6" dot={false} name="Present" />
              <Line type="monotone" dataKey="absent" stroke="#f97316" dot={false} name="Absent" />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </Card>

        <Card className="h-[min(20rem,50vh)] w-full min-w-0 p-4 sm:h-80">
          <h2 className="mb-4 font-medium">Present vs absent (all records)</h2>
          <div className="h-[calc(100%-2.5rem)] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="h-[min(24rem,70vh)] w-full min-w-0 p-4 sm:h-96">
        <h2 className="mb-4 font-medium">Student-wise performance (sample)</h2>
        <div className="h-[calc(100%-2.5rem)] w-full min-w-0 overflow-x-auto">
        <ResponsiveContainer width="100%" height="100%" minHeight={260}>
          <BarChart data={data.student_performance.slice(0, 12)} layout="vertical" margin={{ left: 12, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="percentage" fill="#3b82f6" name="%" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </Card>

      {data.students_at_risk.length > 0 && (
        <Card className="p-4 border-amber-500/40">
          <h2 className="font-medium mb-2 text-amber-700 dark:text-amber-400">Students at risk (below threshold)</h2>
          <ul className="text-sm space-y-1">
            {data.students_at_risk.slice(0, 15).map((s) => (
              <li key={s.roll_number}>
                {s.name} ({s.roll_number}) — {s.percentage}%
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
