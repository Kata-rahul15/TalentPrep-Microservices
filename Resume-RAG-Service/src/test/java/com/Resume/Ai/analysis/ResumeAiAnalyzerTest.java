package com.Resume.Ai.analysis;

import com.Resume.Ai.dto.AtsEvaluation;
import com.Resume.Ai.dto.AtsScores;
import com.Resume.Ai.dto.ResumeAnalysisResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResumeAiAnalyzerTest {

    @Mock
    private ChatClient chatClient;

    @Test
    void analyzerUsesOneChatClientCall() {
        ResumeAnalysisResponse expected = ResumeAnalysisResponse.builder()
                .summary("Backend developer")
                .atsEvaluation(AtsEvaluation.builder()
                        .scores(AtsScores.builder()
                                .atsScore(84)
                                .keywordMatch(79)
                                .formattingScore(91)
                                .technicalSkillsScore(88)
                                .experienceScore(82)
                                .educationScore(85)
                                .overallScore(84)
                                .build())
                        .build())
                .build();

        ChatClient.ChatClientRequestSpec requestSpec = mock(ChatClient.ChatClientRequestSpec.class);
        ChatClient.CallResponseSpec responseSpec = mock(ChatClient.CallResponseSpec.class);

        when(chatClient.prompt()).thenReturn(requestSpec);
        when(requestSpec.user(anyString())).thenReturn(requestSpec);
        when(requestSpec.call()).thenReturn(responseSpec);
        when(responseSpec.entity(ResumeAnalysisResponse.class)).thenReturn(expected);

        ResumeAiAnalyzer analyzer = new ResumeAiAnalyzer(chatClient);
        ResumeAnalysisResponse actual = analyzer.analyze("Rahul Kata\nJava\nSpring Boot");

        assertThat(actual.getAtsEvaluation().getScores().getAtsScore()).isEqualTo(84);
        verify(chatClient, times(1)).prompt();
        verify(requestSpec, times(1)).call();
        verify(responseSpec, times(1)).entity(ResumeAnalysisResponse.class);
    }
}
