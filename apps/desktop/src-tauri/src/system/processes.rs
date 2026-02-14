use crate::system::models::ProcessRow;

pub struct ProcessQuery {
    pub search: Option<String>,
    pub sort_by: Option<String>,
    pub sort_dir: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

pub struct ProcessService {
    rows: Vec<ProcessRow>,
}

impl ProcessService {
    pub fn new_for_tests() -> Self {
        Self { rows: Vec::new() }
    }

    pub fn seed_for_tests(&mut self, rows: Vec<ProcessRow>) {
        self.rows = rows;
    }

    pub fn list(&self, query: ProcessQuery) -> Vec<ProcessRow> {
        let mut rows: Vec<_> = self.rows.clone();

        if let Some(search) = query.search {
            let search = search.to_lowercase();
            rows.retain(|row| {
                row.command.to_lowercase().contains(&search) || row.user.to_lowercase().contains(&search)
            });
        }

        match query.sort_by.as_deref() {
            Some("cpu") => {
                rows.sort_by(|a, b| b.cpu_percent.partial_cmp(&a.cpu_percent).unwrap_or(std::cmp::Ordering::Equal));
            }
            Some("mem") => {
                rows.sort_by(|a, b| b.mem_percent.partial_cmp(&a.mem_percent).unwrap_or(std::cmp::Ordering::Equal));
            }
            Some("pid") => rows.sort_by_key(|row| row.pid),
            Some("user") => rows.sort_by(|a, b| a.user.cmp(&b.user)),
            Some("command") => rows.sort_by(|a, b| a.command.cmp(&b.command)),
            _ => {}
        }

        if query.sort_dir.as_deref() == Some("asc") && query.sort_by.is_some() {
            rows.reverse();
        }

        let offset = query.offset.unwrap_or(0);
        let limit = query.limit.unwrap_or(rows.len());
        rows.into_iter().skip(offset).take(limit).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::{ProcessQuery, ProcessService};
    use crate::system::models::ProcessRow;

    #[test]
    fn list_processes_supports_search_and_cpu_sort() {
        let mut service = ProcessService::new_for_tests();
        service.seed_for_tests(vec![
            ProcessRow {
                pid: 10,
                user: "alice".into(),
                command: "bash".into(),
                cpu_percent: 1.0,
                mem_percent: 0.2,
            },
            ProcessRow {
                pid: 22,
                user: "bob".into(),
                command: "chrome".into(),
                cpu_percent: 35.0,
                mem_percent: 10.0,
            },
        ]);
        let rows = service.list(ProcessQuery {
            search: Some("chr".into()),
            sort_by: Some("cpu".into()),
            sort_dir: Some("desc".into()),
            limit: Some(50),
            offset: Some(0),
        });
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].pid, 22);
    }
}
