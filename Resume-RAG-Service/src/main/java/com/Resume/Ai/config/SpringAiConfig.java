package com.Resume.Ai.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class SpringAiConfig {

    @Bean
    public ChatClient chatClient(
            @Qualifier("openAiChatModel") ChatModel chatModel){

        return ChatClient.builder(chatModel).build();
    }

    @Bean
    @Primary
    public EmbeddingModel embeddingModel(
            @Qualifier("googleGenAiTextEmbedding") EmbeddingModel embeddingModel) {

        return embeddingModel;
    }
}