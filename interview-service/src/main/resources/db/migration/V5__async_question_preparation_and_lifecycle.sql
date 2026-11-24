-- V5: align PostgreSQL question lifecycle with QuestionStatus and coordinate async preparation.
-- Existing valid rows are preserved; unknown legacy values stop the migration rather than being discarded.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM interview_questions
        WHERE question_status NOT IN ('READY', 'PENDING', 'ANSWERED', 'SKIPPED')
    ) THEN
        RAISE EXCEPTION 'interview_questions contains question_status values not represented by QuestionStatus enum';
    END IF;
END $$;

ALTER TABLE interview_questions
    DROP CONSTRAINT IF EXISTS interview_questions_question_status_check;

ALTER TABLE interview_questions
    ADD CONSTRAINT interview_questions_question_status_check
    CHECK (question_status IN ('READY', 'PENDING', 'ANSWERED', 'SKIPPED'));

ALTER TABLE interview_questions
    ADD COLUMN IF NOT EXISTS follow_up_decision VARCHAR(30),
    ADD COLUMN IF NOT EXISTS prepared_for_question_id UUID REFERENCES interview_questions(id),
    ADD COLUMN IF NOT EXISTS triggering_answer_id UUID REFERENCES interview_answers(id);

CREATE INDEX IF NOT EXISTS idx_interview_questions_prepared
    ON interview_questions(prepared_for_question_id, question_status)
    WHERE prepared_for_question_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interview_questions_round_status
    ON interview_questions(round_id, question_status, question_order);

CREATE UNIQUE INDEX IF NOT EXISTS uq_interview_questions_prepared_root
    ON interview_questions(prepared_for_question_id)
    WHERE prepared_for_question_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_interview_questions_triggering_answer
    ON interview_questions(triggering_answer_id)
    WHERE triggering_answer_id IS NOT NULL;
