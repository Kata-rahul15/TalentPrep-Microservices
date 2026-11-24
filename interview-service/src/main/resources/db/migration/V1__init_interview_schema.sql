-- V1__init_interview_schema.sql
-- TalentPrep Interview Service Database Schema

CREATE TABLE IF NOT EXISTS interview_usage (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'FREE',
    sessions_reserved INT NOT NULL DEFAULT 0,
    sessions_consumed INT NOT NULL DEFAULT 0,
    monthly_allowance INT NOT NULL DEFAULT 3,
    plan_renewal_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidate_context_snapshots (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    resume_id UUID NOT NULL,
    candidate_name VARCHAR(255),
    target_role VARCHAR(255),
    experience_level VARCHAR(100),
    context_data JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    snapshot_id UUID NOT NULL REFERENCES candidate_context_snapshots(id),
    status VARCHAR(50) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    mode VARCHAR(50) NOT NULL,
    target_role VARCHAR(255),
    target_job_description TEXT,
    duration_minutes INT DEFAULT 45,
    current_round_index INT DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_rounds (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    round_order INT NOT NULL,
    round_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    target_question_count INT DEFAULT 5,
    completed_question_count INT DEFAULT 0,
    round_score INT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_questions (
    id UUID PRIMARY KEY,
    round_id UUID NOT NULL REFERENCES interview_rounds(id) ON DELETE CASCADE,
    question_order INT NOT NULL,
    question_text TEXT NOT NULL,
    question_category VARCHAR(100),
    difficulty VARCHAR(50),
    is_follow_up BOOLEAN DEFAULT FALSE,
    parent_question_id UUID REFERENCES interview_questions(id),
    question_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    coding_boilerplate TEXT,
    coding_test_cases JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_answers (
    id UUID PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    audio_storage_path VARCHAR(500),
    code_submission TEXT,
    transcription_status VARCHAR(50) DEFAULT 'NONE',
    time_taken_seconds INT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answer_evaluations (
    id UUID PRIMARY KEY,
    answer_id UUID NOT NULL REFERENCES interview_answers(id) ON DELETE CASCADE,
    score INT NOT NULL,
    technical_accuracy INT,
    completeness INT,
    clarity INT,
    problem_solving INT,
    feedback TEXT,
    strengths JSONB,
    improvements JSONB,
    suggested_ideal_answer TEXT,
    evaluation_model VARCHAR(100),
    evaluation_version VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_reports (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
    overall_score INT NOT NULL,
    round_breakdown JSONB NOT NULL,
    strengths JSONB,
    weaknesses JSONB,
    improvement_areas JSONB,
    recommended_topics JSONB,
    summary TEXT,
    generated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance & query isolation
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_status ON interview_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_interview_rounds_session_order ON interview_rounds(session_id, round_order);
CREATE INDEX IF NOT EXISTS idx_interview_questions_round_order ON interview_questions(round_id, question_order);
CREATE INDEX IF NOT EXISTS idx_interview_answers_question ON interview_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_interview_usage_user ON interview_usage(user_id);

