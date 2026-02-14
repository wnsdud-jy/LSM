use std::{
    fs,
    sync::{Mutex, OnceLock},
    time::{SystemTime, UNIX_EPOCH},
};

use crate::{
    app_state::AppState,
    errors::ApiError,
    system::{
        models::{MetricPoint, MetricsSnapshot},
        procfs::{parse_cpu_totals, parse_meminfo},
    },
};

#[derive(Clone, Copy)]
struct LastSample {
    ts_ms: i64,
    net_rx: u64,
    net_tx: u64,
    disk_read: u64,
    disk_write: u64,
}

#[derive(Default)]
struct History {
    cpu: Vec<MetricPoint>,
    ram: Vec<MetricPoint>,
    disk_read: Vec<MetricPoint>,
    disk_write: Vec<MetricPoint>,
    net_rx: Vec<MetricPoint>,
    net_tx: Vec<MetricPoint>,
}

const HISTORY_CAP: usize = 120;
static LAST_SAMPLE: OnceLock<Mutex<Option<LastSample>>> = OnceLock::new();
static HISTORY: OnceLock<Mutex<History>> = OnceLock::new();

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn parse_network_totals(input: &str) -> (u64, u64) {
    let mut total_rx = 0_u64;
    let mut total_tx = 0_u64;

    for line in input.lines() {
        let trimmed = line.trim();
        if !trimmed.contains(':') {
            continue;
        }

        let mut parts = trimmed.split(':');
        let iface = parts.next().unwrap_or("").trim();
        if iface == "lo" || iface.is_empty() {
            continue;
        }

        let data = parts.next().unwrap_or("");
        let cols: Vec<&str> = data.split_whitespace().collect();
        if cols.len() < 9 {
            continue;
        }

        total_rx = total_rx.saturating_add(cols[0].parse::<u64>().unwrap_or(0));
        total_tx = total_tx.saturating_add(cols[8].parse::<u64>().unwrap_or(0));
    }

    (total_rx, total_tx)
}

fn parse_disk_totals(input: &str) -> (u64, u64) {
    let mut total_read_bytes = 0_u64;
    let mut total_write_bytes = 0_u64;

    for line in input.lines() {
        let cols: Vec<&str> = line.split_whitespace().collect();
        if cols.len() < 14 {
            continue;
        }

        let device = cols[2];
        if device.starts_with("loop")
            || device.starts_with("ram")
            || device.starts_with("dm-")
            || device.starts_with("sr")
        {
            continue;
        }

        let read_sectors = cols[5].parse::<u64>().unwrap_or(0);
        let write_sectors = cols[9].parse::<u64>().unwrap_or(0);
        total_read_bytes = total_read_bytes.saturating_add(read_sectors.saturating_mul(512));
        total_write_bytes = total_write_bytes.saturating_add(write_sectors.saturating_mul(512));
    }

    (total_read_bytes, total_write_bytes)
}

fn push_point(series: &mut Vec<MetricPoint>, point: MetricPoint) {
    series.push(point);
    if series.len() > HISTORY_CAP {
        let drop = series.len() - HISTORY_CAP;
        series.drain(0..drop);
    }
}

pub fn get_metrics_snapshot(_state: &AppState) -> Result<MetricsSnapshot, ApiError> {
    let cpu_raw = fs::read_to_string("/proc/stat").map_err(|_| ApiError::Internal)?;
    let mem_raw = fs::read_to_string("/proc/meminfo").map_err(|_| ApiError::Internal)?;
    let net_raw = fs::read_to_string("/proc/net/dev").unwrap_or_default();
    let disk_raw = fs::read_to_string("/proc/diskstats").unwrap_or_default();

    let cpu = parse_cpu_totals(&cpu_raw).ok_or(ApiError::Internal)?;
    let mem = parse_meminfo(&mem_raw).ok_or(ApiError::Internal)?;

    let now = now_ms();
    let cpu_percent = if cpu.total > 0 {
        ((cpu.total.saturating_sub(cpu.idle)) as f64 / cpu.total as f64 * 100.0) as f32
    } else {
        0.0
    };

    let ram_total_bytes = mem.mem_total_kb.saturating_mul(1024);
    let ram_used_bytes = mem
        .mem_total_kb
        .saturating_sub(mem.mem_available_kb)
        .saturating_mul(1024);
    let swap_total_bytes = mem.swap_total_kb.saturating_mul(1024);
    let swap_used_bytes = mem
        .swap_total_kb
        .saturating_sub(mem.swap_free_kb)
        .saturating_mul(1024);

    let (net_rx_total, net_tx_total) = parse_network_totals(&net_raw);
    let (disk_read_total, disk_write_total) = parse_disk_totals(&disk_raw);

    let mut net_rx_bps = 0.0_f64;
    let mut net_tx_bps = 0.0_f64;
    let mut disk_read_bps = 0.0_f64;
    let mut disk_write_bps = 0.0_f64;

    let last_lock = LAST_SAMPLE.get_or_init(|| Mutex::new(None));
    if let Ok(mut last_guard) = last_lock.lock() {
        if let Some(last) = *last_guard {
            let dt_ms = (now - last.ts_ms).max(1) as f64;
            net_rx_bps = (net_rx_total.saturating_sub(last.net_rx) as f64) * 1000.0 / dt_ms;
            net_tx_bps = (net_tx_total.saturating_sub(last.net_tx) as f64) * 1000.0 / dt_ms;
            disk_read_bps =
                (disk_read_total.saturating_sub(last.disk_read) as f64) * 1000.0 / dt_ms;
            disk_write_bps =
                (disk_write_total.saturating_sub(last.disk_write) as f64) * 1000.0 / dt_ms;
        }

        *last_guard = Some(LastSample {
            ts_ms: now,
            net_rx: net_rx_total,
            net_tx: net_tx_total,
            disk_read: disk_read_total,
            disk_write: disk_write_total,
        });
    }

    let history_lock = HISTORY.get_or_init(|| Mutex::new(History::default()));
    if let Ok(mut h) = history_lock.lock() {
        let ram_percent = if ram_total_bytes > 0 {
            (ram_used_bytes as f64 / ram_total_bytes as f64) * 100.0
        } else {
            0.0
        };

        push_point(&mut h.cpu, MetricPoint { ts_ms: now, value: cpu_percent as f64 });
        push_point(&mut h.ram, MetricPoint { ts_ms: now, value: ram_percent });
        push_point(
            &mut h.disk_read,
            MetricPoint {
                ts_ms: now,
                value: disk_read_bps,
            },
        );
        push_point(
            &mut h.disk_write,
            MetricPoint {
                ts_ms: now,
                value: disk_write_bps,
            },
        );
        push_point(
            &mut h.net_rx,
            MetricPoint {
                ts_ms: now,
                value: net_rx_bps,
            },
        );
        push_point(
            &mut h.net_tx,
            MetricPoint {
                ts_ms: now,
                value: net_tx_bps,
            },
        );

        return Ok(MetricsSnapshot {
            cpu_percent,
            ram_used_bytes,
            ram_total_bytes,
            swap_used_bytes,
            swap_total_bytes,
            disk_read_bps,
            disk_write_bps,
            net_rx_bps,
            net_tx_bps,
            cpu_history: h.cpu.clone(),
            ram_history: h.ram.clone(),
            disk_read_history: h.disk_read.clone(),
            disk_write_history: h.disk_write.clone(),
            net_rx_history: h.net_rx.clone(),
            net_tx_history: h.net_tx.clone(),
        });
    }

    Err(ApiError::Internal)
}
