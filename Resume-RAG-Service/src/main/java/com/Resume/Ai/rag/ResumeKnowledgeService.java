package com.Resume.Ai.rag;

import com.Resume.Ai.Entity.Resume;
import com.Resume.Ai.Repositories.ResumeRepository;
import com.Resume.Ai.config.RagProperties;
import com.Resume.Ai.exception.AiServiceException;
import com.Resume.Ai.exception.ResumeNotFoundException;
import com.Resume.Ai.exception.ResumeUnauthorizedAccessException;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Reusable, authorization-scoped semantic retrieval over the existing
 * pgvector index. The caller supplies authenticated identity, never an
 * LLM-selected user identity.
 */
@Service
public class ResumeKnowledgeService {
    private final ResumeRepository resumes;
    private final VectorStore vectorStore;
    private final RagProperties properties;

    public ResumeKnowledgeService(ResumeRepository resumes, VectorStore vectorStore,
                                 RagProperties properties) {
        this.resumes = resumes;
        this.vectorStore = vectorStore;
        this.properties = properties;
    }

    public List<Document> search(UUID authenticatedUserId, UUID resumeId, String query) {
        if (authenticatedUserId == null) {
            throw new IllegalArgumentException("Authenticated user ID is required.");
        }
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("Search query must not be blank.");
        }
        Resume resume = resumes.findById(resumeId)
                .orElseThrow(() -> new ResumeNotFoundException(resumeId));
        if (!authenticatedUserId.equals(resume.getUserId())) {
            throw new ResumeUnauthorizedAccessException(resumeId, authenticatedUserId);
        }

        String filter = "resumeId == '" + resumeId + "'";
        try {
            List<Document> results = vectorStore.similaritySearch(
                    SearchRequest.builder()
                            .query(query.trim())
                            .topK(properties.getTopK())
                            .similarityThreshold(properties.getSimilarityThreshold())
                            .filterExpression(filter)
                            .build());
            return results == null ? List.of() : List.copyOf(results);
        } catch (Exception ex) {
            throw new AiServiceException("Failed to search resume information.", ex);
        }
    }
}
