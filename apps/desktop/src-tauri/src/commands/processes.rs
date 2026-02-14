use crate::{
    app_state::AppState,
    errors::ApiError,
    system::signal::validate_permission,
};

#[derive(Debug, Clone, Copy)]
pub enum ProcessSignal {
    Sigterm,
    Sigkill,
    Sigstop,
    Sigcont,
}

pub fn send_process_signal_inner(
    state: &AppState,
    pid: i32,
    _signal: ProcessSignal,
) -> Result<(), ApiError> {
    validate_permission(state.current_uid(), state.fake_target_uid(), pid).map_err(|_| ApiError::PermissionDenied)
}

pub fn send_process_signal(
    state: &AppState,
    pid: i32,
    signal: ProcessSignal,
) -> Result<(), ApiError> {
    send_process_signal_inner(state, pid, signal)
}

#[cfg(test)]
mod tests {
    use super::{ProcessSignal, send_process_signal_inner};
    use crate::app_state::AppState;

    #[test]
    fn send_process_signal_rejects_foreign_uid() {
        let state = AppState::new_for_tests(1000, 1001);
        let result = send_process_signal_inner(&state, 4242, ProcessSignal::Sigterm);
        assert!(result.is_err());
    }
}
