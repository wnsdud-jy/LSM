import { invoke } from "@tauri-apps/api/core";
import type { MetricsSnapshot, ProcessQuery, ProcessRow, ProcessSignal } from "@/types/system";

export const tauriApi = {
  getMetricsSnapshot: () => invoke<MetricsSnapshot>("get_metrics_snapshot"),
  listProcesses: (query: ProcessQuery) => invoke<ProcessRow[]>("list_processes", { query }),
  sendProcessSignal: (pid: number, signal: ProcessSignal) =>
    invoke<void>("send_process_signal", { pid, signal }),
};
