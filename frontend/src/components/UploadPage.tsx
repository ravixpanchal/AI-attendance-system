import { useState } from "react";
import { API } from "@/lib/api";
import { Button, Card } from "./ui";

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const t = localStorage.getItem("token");
      const res = await fetch(`${API}/upload`, {
        method: "POST",
        headers: t ? { Authorization: `Bearer ${t}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { detail?: string }).detail || res.statusText);
      }
      const data = (await res.json()) as { inserted: number; skipped_duplicate: number };
      setMsg(`Inserted ${data.inserted}, skipped duplicates ${data.skipped_duplicate}`);
      setFile(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Upload students</h1>
        <p className="text-sm text-muted-foreground">
          Excel (.xlsx) or CSV with columns: Student Name, Roll Number, Class/Section
        </p>
      </div>
      <Card className="p-5 sm:p-6">
        <form onSubmit={upload} className="space-y-5">
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground/80">Choose file</div>
            <label
              htmlFor="file-upload"
              className="flex min-h-[44px] cursor-pointer flex-col justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-4 text-center text-sm transition-colors hover:border-primary/40 hover:bg-muted/50"
            >
              <span className="text-muted-foreground">
                {file ? (
                  <span className="font-medium text-foreground">{file.name}</span>
                ) : (
                  <>Tap to select CSV or Excel</>
                )}
              </span>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <Button className="w-full sm:w-auto" type="submit" disabled={!file || loading}>
            {loading ? "Uploading…" : "Upload"}
          </Button>
        </form>
        {msg && (
          <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300">
            {msg}
          </p>
        )}
        {err && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {err}
          </p>
        )}
      </Card>
    </div>
  );
}
