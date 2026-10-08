package com.Resume.Ai.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * AI model wiring for TalentPrep.
 *
 * Qwen/Groq remains the application's primary chat model and is used by the
 * career agent, job-related AI flows, and any existing ChatClient consumers.
 * Resume ingestion gets a dedicated GPT ChatClient so structured resume
 * extraction is independent from the agent model and its tool-calling limits.
 * Gemini remains the embedding provider through Spring AI auto-configuration.
 */
@Configuration
public class SpringAiConfig {

    /**
     * Primary/general ChatClient: Qwen through the configured OpenAI-compatible
     * Groq endpoint. Existing agent and job/RAG services continue to inject
     * ChatClient without code changes.
     */
    @Bean
    @Primary
    public ChatClient chatClient(
            @Qualifier("openAiChatModel") ChatModel chatModel) {
        return ChatClient.builder(chatModel).build();
    }

    /**
     * Dedicated ChatClient for the one semantic resume-analysis call.
     * This model is configured independently from the Qwen agent model.
     */
    @Bean(name = "resumeAnalysisChatClient")
    public ChatClient resumeAnalysisChatClient(
            @Value("${talentprep.ai.resume.base-url:https://api.groq.com/openai/v1}") String baseUrl,
            @Value("${talentprep.ai.resume.api-key:${GROQ_API_KEY:}}") String apiKey,
            @Value("${talentprep.ai.resume.model:openai/gpt-oss-120b}") String model,
            @Value("${talentprep.ai.resume.temperature:0.1}") Double temperature,
            @Value("${talentprep.ai.resume.max-tokens:4096}") Integer maxTokens) {

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "GROQ_API_KEY is required for resume analysis. " +
                    "Set GROQ_API_KEY or talentprep.ai.resume.api-key."
            );
        }

        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .baseUrl(baseUrl)
                .apiKey(apiKey)
                .model(model)
                .temperature(temperature)
                .maxTokens(maxTokens)
                .build();

        OpenAiChatModel resumeModel = OpenAiChatModel.builder()
                .options(options)
                .build();

        return ChatClient.builder(resumeModel).build();
    }

    /** Gemini embedding model remains the single vector/embedding provider. */
    @Bean
    @Primary
    public EmbeddingModel embeddingModel(
            @Qualifier("googleGenAiTextEmbedding") EmbeddingModel embeddingModel) {
        return embeddingModel;
    }
}
