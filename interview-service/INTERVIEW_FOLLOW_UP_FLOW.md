# Interview answer / follow-up / next-question flow

## Runtime flow

1. `InterviewSessionService.submitAnswer` persists the candidate answer and durable evaluation/follow-up tasks.
2. It dispatches three independent operations:
   - `AnswerEvaluationWorker`: scores and persists the evaluation, then emits `ANSWER_EVALUATED`.
   - `FollowUpDecisionWorker`: chooses `ASK_FOLLOW_UP` or `MOVE_ON` using structured JSON.
   - `QuestionPreparationWorker`: generates the next main question independently and persists it as `READY`; its `MAIN_QUESTION_PREPARATION` task is tracked alongside evaluation and follow-up tasks.
3. A prepared main question is associated with its answered root through `prepared_for_question_id`. It is not deliverable merely because it is `READY`.
4. On `ASK_FOLLOW_UP`, the worker persists a follow-up question as `READY`, commits the transaction, then `QuestionFlowCoordinator` atomically changes it to `PENDING` and emits `FOLLOW_UP_READY`.
5. On `MOVE_ON`, the coordinator delivers the already-prepared main question as `PENDING` and emits `NEXT_QUESTION_READY`. If preparation has not finished yet, the preparation worker calls the coordinator after commit.
6. Follow-up questions point to the original main question through `parent_question_id`. The count is capped at two; depth is capped at two. Invalid decisions and follow-up persistence failures fall back to `MOVE_ON`.

## Events

- `ANSWER_SUBMITTED` (the previous `ANSWER_RECEIVED` is also emitted for compatibility)
- `ANSWER_EVALUATED`
- `FOLLOW_UP_READY`
- `NEXT_QUESTION_READY`
- `INTERVIEW_ERROR`

The frontend should subscribe to the existing STOMP destinations and react to these events. The new flow does not require polling.

## Question statuses

`READY` means generated and persisted but not yet delivered. `PENDING` means delivered and awaiting a candidate answer. `ANSWERED` and `SKIPPED` are terminal answer states. Main questions prepared in advance remain `READY` until the follow-up decision resolves to `MOVE_ON`.

## Database change

Run `src/main/resources/db/migration/V5__async_question_preparation_and_lifecycle.sql` manually against the Interview Service PostgreSQL database (Flyway dependencies remain disabled in this project).

The migration:
- checks for unexpected status values and aborts rather than silently rewriting data;
- recreates `interview_questions_question_status_check` with the four Java enum values;
- adds `follow_up_decision` and `prepared_for_question_id`;
- adds lookup and uniqueness indexes to prevent duplicate prepared main questions and duplicate follow-ups for one answer.

Before applying, inspect the live definition with:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'interview_questions'::regclass
  AND conname = 'interview_questions_question_status_check';
```

Take a database backup before applying it. The SQL assumes the existing V1-V4 schema has already been applied. Run `./mvnw test` after applying the migration; this source archive's original Maven wrapper metadata was incomplete, so a Maven 3.9.9 wrapper properties file is included.
