export type Student = {
  id: number;
  roll_number: string;
  name: string;
  class_section: string;
  created_at?: string;
};

export type StudentDetail = Student & {
  attendance_percentage: number;
  total_days: number;
  present_days: number;
  absence_dates: string[];
  monthly_breakdown?: Record<string, { present: number; absent: number }>;
};

export type Analytics = {
  total_students: number;
  average_attendance_percentage: number;
  threshold_percent: number;
  students_below_threshold: {
    student_id: number;
    name: string;
    roll_number: string;
    class_section: string;
    attendance_percentage: number;
  }[];
  students_below_threshold_count: number;
  daily_trend: { date: string; present: number; absent: number; rate?: number }[];
  present_vs_absent: { present: number; absent: number };
  student_performance: { name: string; roll_number: string; percentage: number }[];
  students_at_risk: { name: string; roll_number: string; percentage: number }[];
};

export type ChatMessage = { role: "user" | "assistant"; content: string; data?: unknown };
