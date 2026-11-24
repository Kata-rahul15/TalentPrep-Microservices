-- V4__async_interview_tasks_and_v1_lifecycle.sql
-- TalentPrep Interview V1: Durable task state, monotonic sequencing, idempotency, and question depth

-- 1. Extend interview_sessions for monotonic sequencing and authoritative question tracking
ALTER TABLE interview_sessions
    ADD COLUMN IF NOT EXISTS current_question_id UUID REFERENCES interview_questions(id),
    ADD COLUMN IF NOT EXISTS turn_sequence INT NOT NULL DEFAULT 0;

-- 2. Extend interview_questions for follow-up depth, topic tracking, and delivery auditing
ALTER TABLE interview_questions
    ADD COLUMN IF NOT EXISTS depth INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS topic VARCHAR(100),
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- 3. Extend interview_answers for idempotency and async evaluation status
ALTER TABLE interview_answers
    ADD COLUMN IF NOT EXISTS client_request_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS evaluation_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT NOW();

-- Prevent duplicate answers for the same client submission attempt
CREATE UNIQUE INDEX IF NOT EXISTS uq_interview_answers_question_client_req
    ON interview_answers(question_id, client_request_id)
    WHERE client_request_id IS NOT NULL;

-- 4. Create durable async background tasks table
CREATE TABLE IF NOT EXISTS async_interview_tasks (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    answer_id UUID NOT NULL REFERENCES interview_answers(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL, -- EVALUATION, FOLLOW_UP
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED, TIMED_OUT
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_error_code VARCHAR(100),
    last_error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_async_task_answer_type UNIQUE (answer_id, task_type)
);

CREATE INDEX IF NOT EXISTS idx_async_tasks_status_created ON async_interview_tasks(status, created_at);
CREATE INDEX IF NOT EXISTS idx_async_tasks_session ON async_interview_tasks(session_id);

