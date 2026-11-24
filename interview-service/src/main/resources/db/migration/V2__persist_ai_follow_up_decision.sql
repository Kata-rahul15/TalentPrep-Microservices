ALTER TABLE answer_evaluations
    ADD COLUMN IF NOT EXISTS triggers_follow_up BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS follow_up_reason TEXT;
