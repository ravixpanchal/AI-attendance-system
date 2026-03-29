import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, Input, Label } from "./ui";

export function Login({ onDone }: { onDone: () => void }) {
  const [u, setU] = useState("admin");
  const [p, setP] = useState("admin123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await api<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: u, password: p }),
      });
      localStorage.setItem("token", res.access_token);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-[420px] p-6 sm:p-8 shadow-md">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Smart Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Admin sign in</p>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="user">Username</Label>
            <Input
              id="user"
              value={u}
              onChange={(e) => setU(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pass">Password</Label>
            <Input
              id="pass"
              type="password"
              value={p}
              onChange={(e) => setP(e.target.value)}
              autoComplete="current-password"
              className="w-full"
            />
          </div>
          {err && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {err}
            </p>
          )}
          <Button type="submit" className="h-12 w-full text-base sm:h-11 sm:text-sm" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
