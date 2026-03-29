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
    <div className="min-h-[100dvh] flex flex-col p-4 sm:p-6 bg-white relative overflow-hidden font-sans">
      {/* Ambient Background Blur Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-slate-100 blur-3xl opacity-70"></div>
        <div className="absolute bottom-1/4 -right-24 w-80 h-80 rounded-full bg-slate-50 blur-3xl opacity-70"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-[420px] mx-auto transition-all duration-500 ease-in-out transform hover:-translate-y-1">
        <Card className="w-full px-6 py-8 sm:px-8 sm:py-10 shadow-[0_20px_50px_rgb(0,0,0,0.04)] border border-slate-100 rounded-[2rem] bg-white/90 backdrop-blur-2xl">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 shadow-lg shadow-slate-200">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome Back</h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">Sign in to Smart Attendance</p>
          </div>
          <form onSubmit={submit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="user" className="text-sm font-semibold text-slate-700">Username</Label>
              <Input
                id="user"
                value={u}
                onChange={(e) => setU(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                className="w-full h-11 sm:h-12 rounded-xl border-slate-200 bg-slate-50 px-4 transition-all focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass" className="text-sm font-semibold text-slate-700">Password</Label>
              <Input
                id="pass"
                type="password"
                value={p}
                onChange={(e) => setP(e.target.value)}
                autoComplete="current-password"
                className="w-full h-11 sm:h-12 rounded-xl border-slate-200 bg-slate-50 px-4 transition-all focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            {err && (
              <div className="animate-in fade-in slide-in-from-top-1">
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-medium">
                  {err}
                </p>
              </div>
            )}
            <Button 
              type="submit" 
              className="mt-4 sm:mt-6 h-11 sm:h-12 w-full rounded-xl bg-slate-900 text-sm sm:text-base font-semibold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in…
                </span>
              ) : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
      
      <footer className="w-full py-4 mt-auto text-center z-10 shrink-0">
        <p className="text-xs sm:text-sm font-medium text-slate-500 tracking-wide transition-all hover:text-slate-700">
          Made With ❤️ by Ravi Panchal. All Rights Reserved @2026.
        </p>
      </footer>
    </div>
  );
}
