pub fn cpu_percent(prev: (u64, u64), next: (u64, u64)) -> f32 {
    let idle_delta = next.0.saturating_sub(prev.0) as f32;
    let total_delta = next.1.saturating_sub(prev.1) as f32;

    if total_delta <= 0.0 {
        return 0.0;
    }

    ((total_delta - idle_delta) / total_delta) * 100.0
}

#[cfg(test)]
mod tests {
    #[test]
    fn cpu_percent_uses_idle_and_total_delta() {
        let prev = (100_u64, 200_u64); // (idle,total)
        let next = (130_u64, 260_u64);
        let value = super::cpu_percent(prev, next);
        assert!((value - 50.0).abs() < 0.01);
    }
}
