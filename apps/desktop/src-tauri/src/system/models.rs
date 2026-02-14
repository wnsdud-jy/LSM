use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct MetricPoint {
    pub ts_ms: i64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct MetricsSnapshot {
    pub cpu_percent: f32,
    pub ram_used_bytes: u64,
    pub ram_total_bytes: u64,
    pub swap_used_bytes: u64,
    pub swap_total_bytes: u64,
    pub disk_read_bps: f64,
    pub disk_write_bps: f64,
    pub net_rx_bps: f64,
    pub net_tx_bps: f64,
    pub cpu_history: Vec<MetricPoint>,
    pub ram_history: Vec<MetricPoint>,
    pub disk_read_history: Vec<MetricPoint>,
    pub disk_write_history: Vec<MetricPoint>,
    pub net_rx_history: Vec<MetricPoint>,
    pub net_tx_history: Vec<MetricPoint>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProcessRow {
    pub pid: i32,
    pub user: String,
    pub command: String,
    pub cpu_percent: f32,
    pub mem_percent: f32,
}
