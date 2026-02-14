import { create } from "zustand";
import { normalizeIntervalMs, type PollIntervalMs } from "@/lib/polling";
import type { MetricsSnapshot, ProcessRow } from "@/types/system";
import { tauriApi } from "@/lib/tauriApi";

export type SystemState = {
  intervalMs: PollIntervalMs;
  setIntervalMs: (v: number) => void;
  metrics: MetricsSnapshot;
  processes: ProcessRow[];
  refreshMetrics: () => Promise<void>;
  refreshProcesses: () => Promise<void>;
};

export const useSystemStore = create<SystemState>((set) => ({
  intervalMs: 1000,
  setIntervalMs: (v) => set({ intervalMs: normalizeIntervalMs(v) }),
  metrics: {
    cpu_percent: 0,
    ram_used_bytes: 0,
    ram_total_bytes: 0,
    swap_used_bytes: 0,
    swap_total_bytes: 0,
    disk_read_bps: 0,
    disk_write_bps: 0,
    net_rx_bps: 0,
    net_tx_bps: 0,
    cpu_history: [],
    ram_history: [],
    disk_read_history: [],
    disk_write_history: [],
    net_rx_history: [],
    net_tx_history: [],
  },
  processes: [],
  refreshMetrics: async () => {
    const metrics = await tauriApi.getMetricsSnapshot();
    set({ metrics });
  },
  refreshProcesses: async () => {
    const processes = await tauriApi.listProcesses({});
    set({ processes });
  },
}));
