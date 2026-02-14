import { useEffect, useState } from "react";
import { useSystemStore } from "@/stores/systemStore";
import { PerformanceTab } from "@/features/taskManager/PerformanceTab";
import { ProcessesTab } from "@/features/taskManager/ProcessesTab";
import { ServicesTab } from "@/features/taskManager/ServicesTab";

type TabKey = "performance" | "processes" | "services";

export default function App() {
  const refreshMetrics = useSystemStore((s) => s.refreshMetrics);
  const refreshProcesses = useSystemStore((s) => s.refreshProcesses);
  const metrics = useSystemStore((s) => s.metrics);
  const processes = useSystemStore((s) => s.processes);
  const [tab, setTab] = useState<TabKey>("performance");

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      await refreshMetrics();
      await refreshProcesses();
    };
    void boot();

    const timer = setInterval(() => {
      if (!mounted) return;
      void refreshMetrics();
      void refreshProcesses();
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [refreshMetrics, refreshProcesses]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937,_#05070f_55%)] p-3 text-slate-100 md:p-4">
      <header className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs tracking-[0.22em] text-slate-400">WINDOWS-STYLE TASK MANAGER</p>
          <h1 className="text-xl font-black md:text-2xl">Linux System Monitor</h1>
        </div>
        <nav className="flex flex-wrap gap-2">
          <button
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "performance" ? "bg-slate-200 text-slate-900" : "bg-slate-800 text-slate-200"}`}
            onClick={() => setTab("performance")}
          >
            성능
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "processes" ? "bg-slate-200 text-slate-900" : "bg-slate-800 text-slate-200"}`}
            onClick={() => setTab("processes")}
          >
            앱
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "services" ? "bg-slate-200 text-slate-900" : "bg-slate-800 text-slate-200"}`}
            onClick={() => setTab("services")}
          >
            Services
          </button>
        </nav>
      </header>

      {tab === "performance" && <PerformanceTab metrics={metrics} processes={processes} />}
      {tab === "processes" && <ProcessesTab />}
      {tab === "services" && <ServicesTab />}
    </main>
  );
}
