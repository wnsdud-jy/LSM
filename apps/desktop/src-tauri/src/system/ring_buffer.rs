pub struct RingBuffer<T> {
    cap: usize,
    data: std::collections::VecDeque<T>,
}

impl<T: Clone> RingBuffer<T> {
    pub fn new(cap: usize) -> Self {
        Self {
            cap,
            data: std::collections::VecDeque::with_capacity(cap),
        }
    }

    pub fn push(&mut self, value: T) {
        if self.data.len() == self.cap {
            self.data.pop_front();
        }
        self.data.push_back(value);
    }

    pub fn snapshot(&self) -> Vec<T> {
        self.data.iter().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::RingBuffer;

    #[test]
    fn ring_buffer_keeps_latest_n_points() {
        let mut rb = RingBuffer::new(3);
        rb.push(1);
        rb.push(2);
        rb.push(3);
        rb.push(4);
        assert_eq!(rb.snapshot(), vec![2, 3, 4]);
    }
}
