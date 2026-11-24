package com.talentprep.interview.session;

import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.dto.request.SubmitAnswerRequest;
import com.talentprep.interview.entity.AnswerEvaluation;
import com.talentprep.interview.entity.AsyncInterviewTask;
import com.talentprep.interview.entity.InterviewAnswer;
import com.talentprep.interview.entity.InterviewQuestion;
import com.talentprep.interview.entity.enums.QuestionStatus;
import com.talentprep.interview.entity.enums.TaskStatus;
import com.talentprep.interview.entity.enums.TaskType;
import com.talentprep.interview.evaluation.AnswerEvaluationService;
import com.talentprep.interview.repository.AsyncInterviewTaskRepository;
import com.talentprep.interview.repository.InterviewAnswerRepository;
import com.talentprep.interview.repository.InterviewQuestionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/** Owns answer persistence, durable async tasks, AI evaluation, and the terminal status of the answered question. */
@Service
public class InterviewAnswerService {

    private final InterviewAnswerRepository answerRepository;
    private final InterviewQuestionRepository questionRepository;
    private final AnswerEvaluationService evaluationService;
    private final AsyncInterviewTaskRepository taskRepository;

    public InterviewAnswerService(
            InterviewAnswerRepository answerRepository,
            InterviewQuestionRepository questionRepository,
            AnswerEvaluationService evaluationService,
            AsyncInterviewTaskRepository taskRepository) {
        this.answerRepository = answerRepository;
        this.questionRepository = questionRepository;
        this.evaluationService = evaluationService;
        this.taskRepository = taskRepository;
    }

    public record AnswerSubmissionResult(
            InterviewAnswer answer,
            AsyncInterviewTask evaluationTask,
            AsyncInterviewTask followUpTask,
            AsyncInterviewTask preparationTask,
            boolean isExisting
    ) {}

    @Transactional
    public AnswerSubmissionResult saveAnswerAndRegisterTasks(
            InterviewQuestion question,
            SubmitAnswerRequest request,
            UUID sessionId) {

        String clientRequestId = request.getClientRequestId();

        // 1. Idempotency check: if clientRequestId matches existing answer for this question
        if (clientRequestId != null && !clientRequestId.isBlank()) {
            Optional<InterviewAnswer> existing = answerRepository
                    .findByQuestionIdAndClientRequestId(question.getId(), clientRequestId.trim());
            if (existing.isPresent()) {
                InterviewAnswer ans = existing.get();
                AsyncInterviewTask evalTask = taskRepository
                        .findByAnswerIdAndTaskType(ans.getId(), TaskType.EVALUATION).orElse(null);
                AsyncInterviewTask followUpTask = taskRepository
                        .findByAnswerIdAndTaskType(ans.getId(), TaskType.FOLLOW_UP).orElse(null);
                AsyncInterviewTask preparationTask = taskRepository
                        .findByAnswerIdAndTaskType(ans.getId(), TaskType.MAIN_QUESTION_PREPARATION).orElse(null);
                return new AnswerSubmissionResult(ans, evalTask, followUpTask, preparationTask, true);
            }
        }

        String answerText = request.getAnswerText() == null ? "" : request.getAnswerText().trim();
        InterviewAnswer answer = InterviewAnswer.builder()
                .question(question)
                .answerText(answerText)
                .timeTakenSeconds(request.getTimeTakenSeconds())
                .clientRequestId(clientRequestId != null ? clientRequestId.trim() : null)
                .evaluationStatus("PENDING")
                .submittedAt(LocalDateTime.now())
                .build();
        question.setAnswer(answer);
        answer = answerRepository.save(answer);

        question.setQuestionStatus("SKIPPED".equals(answerText.toUpperCase(Locale.ROOT))
                ? QuestionStatus.SKIPPED : QuestionStatus.ANSWERED);
        questionRepository.save(question);

        // 2. Register durable async background tasks
        AsyncInterviewTask evalTask = AsyncInterviewTask.builder()
                .sessionId(sessionId)
                .answerId(answer.getId())
                .taskType(TaskType.EVALUATION)
                .status(TaskStatus.PENDING)
                .attemptCount(0)
                .maxAttempts(3)
                .build();
        evalTask = taskRepository.save(evalTask);

        AsyncInterviewTask followUpTask = AsyncInterviewTask.builder()
                .sessionId(sessionId)
                .answerId(answer.getId())
                .taskType(TaskType.FOLLOW_UP)
                .status(TaskStatus.PENDING)
                .attemptCount(0)
                .maxAttempts(3)
                .build();
        followUpTask = taskRepository.save(followUpTask);

        AsyncInterviewTask preparationTask = null;
        if (!Boolean.TRUE.equals(question.getIsFollowUp())) {
            preparationTask = AsyncInterviewTask.builder()
                    .sessionId(sessionId)
                    .answerId(answer.getId())
                    .taskType(TaskType.MAIN_QUESTION_PREPARATION)
                    .status(TaskStatus.PENDING)
                    .attemptCount(0)
                    .maxAttempts(3)
                    .build();
            preparationTask = taskRepository.save(preparationTask);
        }

        return new AnswerSubmissionResult(answer, evalTask, followUpTask, preparationTask, false);
    }

    @Transactional
    public AnswerEvaluation submitAndEvaluate(
            InterviewQuestion question,
            SubmitAnswerRequest request,
            CandidateContext context,
            List<ConversationTurn> history) {

        String answerText = request.getAnswerText() == null ? "" : request.getAnswerText().trim();
        InterviewAnswer answer = InterviewAnswer.builder()
                .question(question)
                .answerText(answerText)
                .timeTakenSeconds(request.getTimeTakenSeconds())
                .clientRequestId(request.getClientRequestId())
                .evaluationStatus("COMPLETED")
                .submittedAt(LocalDateTime.now())
                .build();
        question.setAnswer(answer);
        answer = answerRepository.save(answer);

        AnswerEvaluation evaluation = evaluationService.evaluateAndSave(answer, context, history);
        question.setQuestionStatus("SKIPPED".equals(answerText.toUpperCase(Locale.ROOT))
                ? QuestionStatus.SKIPPED : QuestionStatus.ANSWERED);
        questionRepository.save(question);
        return evaluation;
    }
}
