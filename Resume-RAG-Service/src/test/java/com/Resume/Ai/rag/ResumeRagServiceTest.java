package com.Resume.Ai.rag;

import com.Resume.Ai.Entity.Resume;
import com.Resume.Ai.Repositories.ResumeRepository;
import com.Resume.Ai.config.RagProperties;
import com.Resume.Ai.dto.ResumeChatRequest;
import com.Resume.Ai.dto.ResumeChatResponse;
import com.Resume.Ai.exception.ResumeNotFoundException;
import com.Resume.Ai.exception.ResumeUnauthorizedAccessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResumeRagServiceTest {

    @Mock private ResumeRepository resumeRepository;
    @Mock private VectorStore vectorStore;
    @Mock private RagProperties ragProperties;
    @Mock(answer = Answers.RETURNS_DEEP_STUBS) private ChatClient chatClient;

    private ResumeRagService ragService;

    private static final UUID USER_ID   = UUID.randomUUID();
    private static final UUID RESUME_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        lenient().when(ragProperties.getTopK()).thenReturn(5);
        lenient().when(ragProperties.getSimilarityThreshold()).thenReturn(0.50);

        ragService = new ResumeRagService(resumeRepository, vectorStore, ragProperties, chatClient);
    }

    @Test
    @DisplayName("Happy path — valid user and resume returns grounded answer with sources")
    void answerQuestion_happyPath_returnsAnswer() {
        Resume resume = Resume.builder().id(RESUME_ID).userId(USER_ID).build();
        when(resumeRepository.findById(RESUME_ID)).thenReturn(Optional.of(resume));

        Document doc = new Document("5 years Java experience", Map.of("section", "EXPERIENCE", "chunkIndex", 0, "score", 0.95));
        when(vectorStore.similaritySearch(any(SearchRequest.class))).thenReturn(List.of(doc));

        when(chatClient.prompt(any(org.springframework.ai.chat.prompt.Prompt.class)).call().content()).thenReturn("Candidate has 5 years of Java experience.");

        ResumeChatRequest request = new ResumeChatRequest("How many years of Java?");
        ResumeChatResponse response = ragService.answerQuestion(USER_ID, RESUME_ID, request);

        assertThat(response).isNotNull();
        assertThat(response.getAnswer()).contains("5 years");
        assertThat(response.getSources()).hasSize(1);
    }

    @Test
    @DisplayName("Unauthorized user — throws ResumeUnauthorizedAccessException")
    void answerQuestion_unauthorized_throwsException() {
        UUID otherUser = UUID.randomUUID();
        Resume resume = Resume.builder().id(RESUME_ID).userId(USER_ID).build();
        when(resumeRepository.findById(RESUME_ID)).thenReturn(Optional.of(resume));

        ResumeChatRequest request = new ResumeChatRequest("What skills?");

        assertThatThrownBy(() -> ragService.answerQuestion(otherUser, RESUME_ID, request))
                .isInstanceOf(ResumeUnauthorizedAccessException.class);
    }

    @Test
    @DisplayName("Resume not found — throws ResumeNotFoundException")
    void answerQuestion_notFound_throwsException() {
        when(resumeRepository.findById(any())).thenReturn(Optional.empty());

        ResumeChatRequest request = new ResumeChatRequest("Hello?");

        assertThatThrownBy(() -> ragService.answerQuestion(USER_ID, RESUME_ID, request))
                .isInstanceOf(ResumeNotFoundException.class);
    }
}
