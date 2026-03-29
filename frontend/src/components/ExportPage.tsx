import { useState } from "react";
import { exportUrl, API } from "@/lib/api";
import { Button, Card, Input, Label, Select } from "./ui";

export function ExportPage() {
  const [classSection, setClassSection] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [format, setFormat] = useState<"csv" | "xlsx">("csv");
  const [err, setErr] = useState("");

  async function download() {
    setErr("");
    const url = exportUrl(format, {
      class_section: classSection || undefined,
      date_from: from || undefined,
      date_to: to || undefined,
    });
    const t = localStorage.getItem("token");
    try {
      const res = await fetch(url, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = `attendance.${format === "csv" ? "csv" : "xlsx"}`;
      a.click();
      URL.revokeObjectURL(u);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Download failed");
    }
  }

  return (
    <div className="w-full max-w-lg space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Export</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download attendance as CSV or Excel
          {API ? ` (${API})` : ""}
        </p>
      </div>
      <Card className="space-y-5 p-5 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="export-format">Format</Label>
          <Select
            id="export-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as "csv" | "xlsx")}
          >
            <option value="csv">CSV</option>
            <option value="xlsx">Excel (.xlsx)</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="export-class">Class / section (optional)</Label>
          <Input
            id="export-class"
            value={classSection}
            onChange={(e) => setClassSection(e.target.value)}
            placeholder="e.g. Section A"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="export-from">From date</Label>
            <Input id="export-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="export-to">To date</Label>
            <Input id="export-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <Button className="w-full sm:w-auto" type="button" onClick={() => void download()}>
          Download
        </Button>
        {err && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {err}
          </p>
        )}
      </Card>
    </div>
  );
}
