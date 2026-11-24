-- V6__add_idempotency_key_to_interview_sessions.sql
-- Enforces idempotent session creation per user

ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uq_interview_sessions_user_idempotency
    ON interview_sessions (user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
