package com.talentprep.interview.session;

import com.talentprep.interview.agent.InterviewAgent;
import com.talentprep.interview.agent.dto.AgentQuestionResponse;
import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.coding.entity.CodingProblem;
import com.talentprep.interview.coding.service.CodingProblemBankService;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.dto.response.InterviewQuestionResponse;
import com.talentprep.interview.entity.InterviewQuestion;
import com.talentprep.interview.entity.InterviewRound;
import com.talentprep.interview.entity.InterviewSession;
import com.talentprep.interview.entity.enums.QuestionStatus;
import com.talentprep.interview.repository.InterviewQuestionRepository;
import com.talentprep.interview.repository.InterviewRoundRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Owns AI question generation, question persistence and the frontend question projection. */
@Service
public class InterviewQuestionService {

    private final InterviewQuestionRepository questionRepository;
    private final InterviewAgent interviewAgent;
    private final InterviewRoundRepository roundRepository;
    private final CodingProblemBankService problemBankService;


    public InterviewQuestionService(
            InterviewQuestionRepository questionRepository,
            InterviewAgent interviewAgent,
            InterviewRoundRepository roundRepository,
            CodingProblemBankService problemBankService) {
        this.questionRepository = questionRepository;
        this.interviewAgent = interviewAgent;
        this.roundRepository = roundRepository;
        this.problemBankService = problemBankService;
    }

    @Transactional
    public InterviewQuestionResponse generateQuestion(
            InterviewSession session,
            InterviewRound round,
            CandidateContext context,
            List<ConversationTurn> history,
            int questionOrder) {

        AgentQuestionResponse generated = interviewAgent.askNextQuestion(
                round.getRoundType(), context, session.getDifficulty(), history,
                questionOrder, round.getTargetQuestionCount());

        InterviewQuestion question = InterviewQuestion.builder()
                .round(round)
                .questionOrder(questionOrder)
                .questionText(generated.getQuestionText())
                .questionCategory(generated.getQuestionCategory())
                .difficulty(generated.getDifficulty())
                .isFollowUp(Boolean.TRUE.equals(generated.getIsFollowUp()))
                .depth(0)
                .topic(generated.getQuestionCategory())
                .deliveredAt(java.time.LocalDateTime.now())
                .questionStatus(QuestionStatus.PENDING)
                .codingBoilerplate(generated.getCodingBoilerplate())
                .codingTestCases(generated.getCodingTestCases())
                .codingProblemId(generated.getCodingProblemId())
                .codingHiddenTestCases(generated.getCodingHiddenTestCases())
                .build();

        question = questionRepository.save(question);
        session.setCurrentQuestionId(question.getId());
        session.setTurnSequence((session.getTurnSequence() != null ? session.getTurnSequence() : 0) + 1);

        return toResponse(question, round, session);
    }


    /**
     * Generates the next MAIN question in the background. It is persisted as READY and
     * remains invisible to the candidate until the follow-up decision resolves to MOVE_ON.
     */
    @Transactional
    public InterviewQuestion prepareNextMainQuestion(
            InterviewSession session,
            InterviewRound round,
            CandidateContext context,
            List<ConversationTurn> history,
            UUID preparedForQuestionId) {

        int nextOrder = questionRepository.findAllByRoundIdOrderByQuestionOrderAsc(round.getId()).size() + 1;
        AgentQuestionResponse generated = interviewAgent.askNextQuestion(
                round.getRoundType(), context, session.getDifficulty(), history,
                nextOrder, round.getTargetQuestionCount());

        // Serialize only the short persistence/sequence allocation phase, not the AI call.
        InterviewRound lockedRound = roundRepository.findByIdForUpdate(round.getId()).orElse(round);
        int persistedOrder = questionRepository.findAllByRoundIdOrderByQuestionOrderAsc(round.getId()).size() + 1;
        InterviewQuestion question = InterviewQuestion.builder()
                .round(lockedRound)
                .questionOrder(persistedOrder)
                .questionText(generated.getQuestionText())
                .questionCategory(generated.getQuestionCategory())
                .difficulty(generated.getDifficulty())
                .isFollowUp(false)
                .depth(0)
                .topic(generated.getQuestionCategory())
                .preparedForQuestionId(preparedForQuestionId)
                .questionStatus(QuestionStatus.READY)
                .codingBoilerplate(generated.getCodingBoilerplate())
                .codingTestCases(generated.getCodingTestCases())
                .codingProblemId(generated.getCodingProblemId())
                .codingHiddenTestCases(generated.getCodingHiddenTestCases())
                .build();

        return questionRepository.save(question);
    }

    public InterviewQuestionResponse toResponse(InterviewQuestion question, InterviewRound round, InterviewSession session) {
        Map<String, String> starterTemplates = null;
        if (question.getCodingProblemId() != null && problemBankService != null) {
            starterTemplates = problemBankService.findById(question.getCodingProblemId())
                    .map(CodingProblem::getStarterCode)
                    .orElse(null);
        }
        if (starterTemplates == null && question.getCodingBoilerplate() != null) {
            starterTemplates = Map.of("java", question.getCodingBoilerplate());
        }

        return InterviewQuestionResponse.builder()
                .questionId(question.getId())
                .roundId(round.getId())
                .sessionId(session.getId())
                .roundOrder(round.getRoundOrder())
                .roundType(round.getRoundType().name())
                .questionOrder(question.getQuestionOrder())
                .targetQuestionCount(round.getTargetQuestionCount())
                .questionText(question.getQuestionText())
                .questionCategory(question.getQuestionCategory())
                .difficulty(question.getDifficulty())
                .isFollowUp(question.getIsFollowUp())
                .parentQuestionId(question.getParentQuestionId())
                .depth(question.getDepth() != null ? question.getDepth() : 0)
                .topic(question.getTopic())
                .questionStatus(question.getQuestionStatus())
                .codingBoilerplate(question.getCodingBoilerplate())
                .codingStarterTemplates(starterTemplates)
                .codingTestCases(question.getCodingTestCases() != null ? question.getCodingTestCases() : List.of())
                .createdAt(question.getCreatedAt())
                .build();
    }
}
