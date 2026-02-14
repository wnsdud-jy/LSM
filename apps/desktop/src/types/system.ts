export type ProcessRow = {
  pid: number;
  user: string;
  command: string;
  cpu_percent: number;
  mem_percent: number;
};

export type MetricPoint = {
  ts_ms: number;
  value: number;
};

export type MetricsSnapshot = {
  cpu_percent: number;
  ram_used_bytes: number;
  ram_total_bytes: number;
  swap_used_bytes: number;
  swap_total_bytes: number;
  disk_read_bps: number;
  disk_write_bps: number;
  net_rx_bps: number;
  net_tx_bps: number;
  cpu_history: MetricPoint[];
  ram_history: MetricPoint[];
  disk_read_history: MetricPoint[];
  disk_write_history: MetricPoint[];
  net_rx_history: MetricPoint[];
  net_tx_history: MetricPoint[];
};

export type ProcessQuery = {
  search?: string;
  sort_by?: "cpu" | "mem" | "pid" | "user" | "command";
  sort_dir?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export type ProcessSignal = "Sigterm" | "Sigkill" | "Sigstop" | "Sigcont";
