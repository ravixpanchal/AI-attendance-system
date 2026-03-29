const API: string = import.meta.env.VITE_API_URL || "";

if (!import.meta.env.VITE_API_URL) {
  console.warn("VITE_API_URL is not set — using relative paths (dev proxy mode)");
}

function authHeader(): HeadersInit {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const API_DOWN_HINT =
  "The backend API is not reachable. From the backend folder (venv active), run: uvicorn main:app --reload --host 127.0.0.1 --port 8765";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
        ...init?.headers,
      },
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    throw new Error(`${reason} ${API_DOWN_HINT}`);
  }
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-logout"));
  }
  if (!res.ok) {
    const raw = await res.text();
    let err: { detail?: string | { msg?: string }[] } = {};
    try {
      err = JSON.parse(raw) as typeof err;
    } catch {
      /* proxy/HTML error bodies */
    }
    let msg = res.statusText;
    if (typeof err.detail === "string") msg = err.detail;
    else if (Array.isArray(err.detail))
      msg = err.detail.map((d) => (typeof d === "object" && d && "msg" in d ? String(d.msg) : "")).join("; ");
    const unreachable =
      res.status === 502 ||
      res.status === 503 ||
      res.status === 504 ||
      (res.status === 500 && (msg === "Internal Server Error" || raw.includes("ECONNREFUSED")));
    if (unreachable) msg = API_DOWN_HINT;
    if (res.status === 404 && msg === "Not Found") {
      msg =
        "Not Found — wrong server or path. Run this API on port 8765 (see frontend/.env): uvicorn main:app --reload --host 127.0.0.1 --port 8765";
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type");
  if (ct?.includes("application/json")) return res.json() as Promise<T>;
  return res.text() as Promise<T>;
}

export function exportUrl(
  format: "csv" | "xlsx",
  q: { student_id?: number; class_section?: string; date_from?: string; date_to?: string }
) {
  const p = new URLSearchParams({ format });
  if (q.student_id) p.set("student_id", String(q.student_id));
  if (q.class_section) p.set("class_section", q.class_section);
  if (q.date_from) p.set("date_from", q.date_from);
  if (q.date_to) p.set("date_to", q.date_to);
  return `${API}/export?${p.toString()}`;
}

export { API };
