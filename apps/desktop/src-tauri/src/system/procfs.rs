#[derive(Debug, Clone, Copy)]
pub struct CpuTotals {
    pub idle: u64,
    pub total: u64,
}

#[derive(Debug, Clone, Copy)]
pub struct MemInfo {
    pub mem_total_kb: u64,
    pub mem_available_kb: u64,
    pub swap_total_kb: u64,
    pub swap_free_kb: u64,
}

pub fn parse_cpu_totals(input: &str) -> Option<CpuTotals> {
    let cpu_line = input.lines().find(|l| l.starts_with("cpu "))?;
    let nums: Vec<u64> = cpu_line
        .split_whitespace()
        .skip(1)
        .filter_map(|v| v.parse::<u64>().ok())
        .collect();
    if nums.len() < 4 {
        return None;
    }
    let idle = nums[3];
    let total = nums.iter().sum();
    Some(CpuTotals { idle, total })
}

pub fn parse_meminfo(input: &str) -> Option<MemInfo> {
    let mut mem_total = None;
    let mut mem_available = None;
    let mut swap_total = None;
    let mut swap_free = None;

    for line in input.lines() {
        let mut parts = line.split_whitespace();
        match parts.next()? {
            "MemTotal:" => mem_total = parts.next().and_then(|v| v.parse().ok()),
            "MemAvailable:" => mem_available = parts.next().and_then(|v| v.parse().ok()),
            "SwapTotal:" => swap_total = parts.next().and_then(|v| v.parse().ok()),
            "SwapFree:" => swap_free = parts.next().and_then(|v| v.parse().ok()),
            _ => {}
        }
    }

    Some(MemInfo {
        mem_total_kb: mem_total?,
        mem_available_kb: mem_available?,
        swap_total_kb: swap_total?,
        swap_free_kb: swap_free?,
    })
}

#[cfg(test)]
mod tests {
    #[test]
    fn parse_meminfo_extracts_totals() {
        let text = "MemTotal:       16384256 kB\nMemAvailable:   10240000 kB\nSwapTotal:      2097148 kB\nSwapFree:       1048574 kB\n";
        let parsed = super::parse_meminfo(text).expect("parsed");
        assert_eq!(parsed.mem_total_kb, 16384256);
        assert_eq!(parsed.mem_available_kb, 10240000);
        assert_eq!(parsed.swap_total_kb, 2097148);
        assert_eq!(parsed.swap_free_kb, 1048574);
    }

    #[test]
    fn parse_cpu_totals_extracts_idle_and_total() {
        let text = "cpu  2255 34 2290 22625563 6290 127 456 0 0 0\n";
        let cpu = super::parse_cpu_totals(text).expect("cpu");
        assert_eq!(cpu.idle, 22625563);
        assert_eq!(cpu.total, 22637015);
    }
}
