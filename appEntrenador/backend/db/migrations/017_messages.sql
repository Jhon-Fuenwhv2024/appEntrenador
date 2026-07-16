-- Feature 034: mensajería interna (chat SSE)
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_receiver (receiver_id),
    INDEX idx_messages_pair_created (sender_id, receiver_id, created_at),
    CONSTRAINT fk_messages_sender
      FOREIGN KEY (sender_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_receiver
      FOREIGN KEY (receiver_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;
