import { tauriApi } from "@/lib/tauriApi";
import type { ProcessSignal } from "@/types/system";

export function ProcessActionButtons({ pid, onDone }: { pid: number; onDone: () => Promise<void> }) {
  const run = async (signal: ProcessSignal) => {
    await tauriApi.sendProcessSignal(pid, signal);
    await onDone();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200" onClick={() => void run("Sigterm")}>
        End
      </button>
      <button className="rounded border border-red-500/50 bg-red-500/10 px-2 py-1 text-xs text-red-200" onClick={() => void run("Sigkill")}>
        Force
      </button>
      <button className="rounded border border-amber-500/50 bg-amber-500/10 px-2 py-1 text-xs text-amber-200" onClick={() => void run("Sigstop")}>
        Pause
      </button>
      <button className="rounded border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200" onClick={() => void run("Sigcont")}>
        Resume
      </button>
    </div>
  );
}
