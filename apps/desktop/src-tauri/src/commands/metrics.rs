use crate::{app_state::AppState, errors::ApiError, system::models::MetricsSnapshot};

pub fn get_metrics_snapshot(_state: &AppState) -> Result<MetricsSnapshot, ApiError> {
    Err(ApiError::Internal)
}
