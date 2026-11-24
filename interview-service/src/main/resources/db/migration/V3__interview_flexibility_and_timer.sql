-- V3__interview_flexibility_and_timer.sql
-- Make resume optional when starting interviews and add server-authoritative pause timer columns

ALTER TABLE candidate_context_snapshots
    ALTER COLUMN resume_id DROP NOT NULL;

ALTER TABLE interview_sessions
    ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS total_paused_seconds BIGINT NOT NULL DEFAULT 0;

