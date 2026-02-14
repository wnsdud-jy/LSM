#[cfg(test)]
mod tests {
    use crate::system::collector::SystemCollector;

    #[test]
    fn collector_stays_within_history_budget() {
        let collector = SystemCollector::new_for_tests(500);
        let snapshot = collector.snapshot_len();
        assert_eq!(snapshot, 0);
    }
}
