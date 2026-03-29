import { useEffect, useState } from "react";
import { Layout, type Tab } from "./components/Layout";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { StudentsPage } from "./components/StudentsPage";
import { AttendancePage } from "./components/AttendancePage";
import { UploadPage } from "./components/UploadPage";
import { AIChat } from "./components/AIChat";
import { ExportPage } from "./components/ExportPage";

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [tab, setTab] = useState<Tab>("dash");
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const onLogout = () => setToken(null);
    window.addEventListener("auth-logout", onLogout);
    return () => window.removeEventListener("auth-logout", onLogout);
  }, []);

  if (!token) {
    return <Login onDone={() => setToken(localStorage.getItem("token"))} />;
  }

  return (
    <Layout
      tab={tab}
      onTab={setTab}
      dark={dark}
      onToggleTheme={() => setDark((d) => !d)}
      onLogout={() => {
        localStorage.removeItem("token");
        setToken(null);
      }}
    >
      {tab === "dash" && <Dashboard />}
      {tab === "students" && <StudentsPage />}
      {tab === "attendance" && <AttendancePage />}
      {tab === "upload" && <UploadPage />}
      {tab === "ai" && <AIChat />}
      {tab === "export" && <ExportPage />}
    </Layout>
  );
}
