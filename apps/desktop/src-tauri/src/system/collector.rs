use crate::system::{
    delta::cpu_percent,
    models::*,
    procfs::{parse_cpu_totals, parse_meminfo},
    ring_buffer::RingBuffer,
};

pub struct SystemCollector {
    interval_ms: u64,
    last_cpu: Option<(u64, u64)>,
    last_net: Option<(u64, u64)>,
    last_disk: Option<(u64, u64)>,
    cpu_history: RingBuffer<MetricPoint>,
    ram_history: RingBuffer<MetricPoint>,
    disk_read_history: RingBuffer<MetricPoint>,
    disk_write_history: RingBuffer<MetricPoint>,
    net_rx_history: RingBuffer<MetricPoint>,
    net_tx_history: RingBuffer<MetricPoint>,
}

impl SystemCollector {
    pub fn new(interval_ms: u64) -> Self {
        let cap = ((60_000 / interval_ms.max(500)) as usize).max(30);
        Self {
            interval_ms,
            last_cpu: None,
            last_net: None,
            last_disk: None,
            cpu_history: RingBuffer::new(cap),
            ram_history: RingBuffer::new(cap),
            disk_read_history: RingBuffer::new(cap),
            disk_write_history: RingBuffer::new(cap),
            net_rx_history: RingBuffer::new(cap),
            net_tx_history: RingBuffer::new(cap),
        }
    }

    pub fn new_for_tests(interval_ms: u64) -> Self {
        Self::new(interval_ms)
    }

    pub fn snapshot_len(&self) -> usize {
        self.cpu_history.snapshot().len()
    }

    fn parse_network_bytes(line: &str) -> Option<(u64, u64)> {
        let mut parts = line.split_whitespace();
        parts.next()?;
        let rx = parts.next()?.parse::<u64>().ok()?;
        let skip_len = 7;
        for _ in 0..skip_len {
            parts.next()?;
        }
        let tx = parts.next()?.parse::<u64>().ok()?;
        Some((rx, tx))
    }

    fn parse_disk_bytes(line: &str) -> Option<(u64, u64)> {
        let mut parts = line.split_whitespace().skip(2);
        parts.next()?;
        let read = parts.next()?.parse::<u64>().ok()?;
        let _ = parts.next()?;
        let _ = parts.next()?;
        let _ = parts.next()?;
        let write = parts.next()?.parse::<u64>().ok()?;
        Some((read, write))
    }

    pub fn ingest_for_tests(
        &mut self,
        cpu_raw: &str,
        mem_raw: &str,
        net_raw: &str,
        disk_raw: &str,
        now_ms: u64,
    ) -> Option<MetricsSnapshot> {
        let cpu_totals = parse_cpu_totals(cpu_raw)?;
        let mem = parse_meminfo(mem_raw)?;
        let net = Self::parse_network_bytes(net_raw)?;
        let disk = Self::parse_disk_bytes(disk_raw)?;

        let cpu_percent = self
            .last_cpu
            .map_or(0.0, |prev| cpu_percent(prev, (cpu_totals.idle, cpu_totals.total)) as f64);

        let (net_rx_bps, net_tx_bps) = self
            .last_net
            .map(|prev| {
                let delta_ms = self.interval_ms.max(1) as f64;
                (
                    ((net.0.saturating_sub(prev.0) as f64) * 1000.0) / delta_ms,
                    ((net.1.saturating_sub(prev.1) as f64) * 1000.0) / delta_ms,
                )
            })
            .unwrap_or((0.0, 0.0));

        let (disk_read_bps, disk_write_bps) = self
            .last_disk
            .map(|prev| {
                let delta_ms = self.interval_ms.max(1) as f64;
                (
                    ((disk.0.saturating_sub(prev.0) as f64) * 1000.0) / delta_ms,
                    ((disk.1.saturating_sub(prev.1) as f64) * 1000.0) / delta_ms,
                )
            })
            .unwrap_or((0.0, 0.0));

        let ram_used_bytes = (mem.mem_total_kb.saturating_sub(mem.mem_available_kb)) * 1024;
        let ram_total_bytes = mem.mem_total_kb * 1024;
        let swap_used_bytes = (mem.swap_total_kb.saturating_sub(mem.swap_free_kb)) * 1024;
        let swap_total_bytes = mem.swap_total_kb * 1024;

        self.cpu_history.push(MetricPoint {
            ts_ms: now_ms as i64,
            value: cpu_percent,
        });
        self.ram_history.push(MetricPoint {
            ts_ms: now_ms as i64,
            value: if ram_total_bytes > 0 {
                ram_used_bytes as f64 / ram_total_bytes as f64 * 100.0
            } else {
                0.0
            },
        });
        self.disk_read_history.push(MetricPoint {
            ts_ms: now_ms as i64,
            value: disk_read_bps,
        });
        self.disk_write_history.push(MetricPoint {
            ts_ms: now_ms as i64,
            value: disk_write_bps,
        });
        self.net_rx_history.push(MetricPoint {
            ts_ms: now_ms as i64,
            value: net_rx_bps,
        });
        self.net_tx_history.push(MetricPoint {
            ts_ms: now_ms as i64,
            value: net_tx_bps,
        });

        self.last_cpu = Some((cpu_totals.idle, cpu_totals.total));
        self.last_net = Some(net);
        self.last_disk = Some(disk);

        Some(MetricsSnapshot {
            cpu_percent: cpu_percent as f32,
            ram_used_bytes,
            ram_total_bytes,
            swap_used_bytes,
            swap_total_bytes,
            disk_read_bps,
            disk_write_bps,
            net_rx_bps,
            net_tx_bps,
            cpu_history: self.cpu_history.snapshot(),
            ram_history: self.ram_history.snapshot(),
            disk_read_history: self.disk_read_history.snapshot(),
            disk_write_history: self.disk_write_history.snapshot(),
            net_rx_history: self.net_rx_history.snapshot(),
            net_tx_history: self.net_tx_history.snapshot(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::SystemCollector;

    #[test]
    fn collector_generates_rates_and_history_points() {
        let mut collector = SystemCollector::new_for_tests(500);
        let _ = collector.ingest_for_tests(
            "cpu  1 1 1 10 0 0 0 0 0 0\n",
            "MemTotal: 1000 kB\nMemAvailable: 400 kB\nSwapTotal: 200 kB\nSwapFree: 100 kB\n",
            "eth0: 1000 0 0 0 0 0 0 0 2000 0 0 0 0 0 0 0\n",
            "   8       0 sda 1 0 100 0 1 0 200 0 0 0 0 0 0 0 0 0 0\n",
            1_000,
        )
        .unwrap();
        let snap = collector
            .ingest_for_tests(
                "cpu  2 2 2 12 0 0 0 0 0 0\n",
                "MemTotal: 1000 kB\nMemAvailable: 300 kB\nSwapTotal: 200 kB\nSwapFree: 90 kB\n",
                "eth0: 2000 0 0 0 0 0 0 0 2600 0 0 0 0 0 0 0\n",
                "   8       0 sda 2 0 300 0 2 0 500 0 0 0 0 0 0 0 0 0 0\n",
                1_500,
            )
            .unwrap();
        assert!(snap.net_rx_bps > 0.0);
        assert!(snap.disk_write_bps > 0.0);
        assert_eq!(snap.cpu_history.len(), 2);
    }
}
