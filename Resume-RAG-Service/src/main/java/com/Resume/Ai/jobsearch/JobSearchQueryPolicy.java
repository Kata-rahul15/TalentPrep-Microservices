package com.Resume.Ai.jobsearch;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Keeps Google Jobs queries broad enough to retrieve jobs. The resume matcher
 * should do detailed skill matching after retrieval instead of forcing Google
 * Jobs to match every technology in a resume.
 */
public final class JobSearchQueryPolicy {
    private static final int MAX_QUERY_LENGTH = 120;

    private JobSearchQueryPolicy() {}

    public static String normalize(String query) {
        if (query == null) {
            return "";
        }
        String q = query.replaceAll("[\\r\\n\\t]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
        if (q.length() > MAX_QUERY_LENGTH) {
            q = q.substring(0, MAX_QUERY_LENGTH).trim();
        }
        return q;
    }

    public static String aiSafeQuery(String query) {
        String q = normalize(query);
        if (q.isBlank()) {
            return q;
        }

        String lower = q.toLowerCase(Locale.ROOT);
        if (tokenCount(q) <= 4) {
            return q;
        }

        if (containsAny(lower, "java") && containsAny(lower, "backend", "back-end", "microservices", "spring boot", "spring")) {
            return "Java Backend Developer";
        }
        if (containsAny(lower, "spring boot", "springboot")) {
            return "Spring Boot Developer";
        }
        if (containsAny(lower, "react") && containsAny(lower, "node", "node.js", "full stack", "full-stack")) {
            return "Full Stack Developer";
        }
        if (containsAny(lower, "python") && containsAny(lower, "backend", "django", "flask", "fastapi")) {
            return "Python Backend Developer";
        }
        if (containsAny(lower, "devops", "kubernetes", "terraform") && containsAny(lower, "aws", "azure", "gcp", "cloud")) {
            return "DevOps Engineer";
        }

        List<String> roles = List.of(
                "software engineer", "software developer", "backend developer",
                "frontend developer", "full stack developer", "java developer",
                "data engineer", "devops engineer", "platform engineer",
                "qa engineer", "test engineer", "machine learning engineer",
                "ai engineer", "mobile developer"
        );
        for (String role : roles) {
            if (lower.contains(role)) {
                List<String> extras = extractTechnologies(lower);
                return extras.isEmpty() ? titleCase(role) : titleCase(role) + " " + String.join(" ", extras.subList(0, Math.min(2, extras.size())));
            }
        }

        // Last-resort broad query: keep only the first few meaningful tokens.
        String[] tokens = q.split("\\s+");
        StringBuilder result = new StringBuilder();
        for (String token : tokens) {
            if (isNoise(token)) continue;
            if (!result.isEmpty()) result.append(' ');
            result.append(token);
            if (tokenCount(result.toString()) >= 5) break;
        }
        return result.isEmpty() ? q : result.toString();
    }

    public static List<String> fallbackQueries(String query) {
        String q = normalize(query);
        String lower = q.toLowerCase(Locale.ROOT);
        Set<String> candidates = new LinkedHashSet<>();
        String safe = aiSafeQuery(q);
        if (!safe.isBlank()) candidates.add(safe);
        if (containsAny(lower, "java")) candidates.add("Java Backend Developer");
        if (containsAny(lower, "spring boot", "springboot")) candidates.add("Spring Boot Developer");
        if (containsAny(lower, "react")) candidates.add("React Developer");
        if (containsAny(lower, "python")) candidates.add("Python Developer");
        if (containsAny(lower, "software engineer", "software developer")) candidates.add("Software Engineer");
        return new ArrayList<>(candidates);
    }

    private static List<String> extractTechnologies(String lower) {
        List<String> known = List.of("java", "spring boot", "python", "react", "node.js", "typescript", "javascript", ".net", "c#", "go", "golang", "aws", "azure", "gcp", "kafka", "docker", "kubernetes");
        List<String> found = new ArrayList<>();
        for (String tech : known) {
            if (lower.contains(tech) && !tech.equals("java") && !tech.equals("spring boot")) found.add(tech);
        }
        return found;
    }

    private static boolean containsAny(String value, String... terms) {
        for (String term : terms) if (value.contains(term)) return true;
        return false;
    }

    private static boolean isNoise(String token) {
        String t = token.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9#+.-]", "");
        return Set.of("developer", "engineer", "role", "jobs", "job", "candidate", "resume", "skills", "experience", "find", "for", "me", "with", "and", "or", "the", "a", "an").contains(t);
    }

    private static int tokenCount(String value) {
        return value == null || value.isBlank() ? 0 : value.trim().split("\\s+").length;
    }

    private static String titleCase(String value) {
        StringBuilder result = new StringBuilder();
        for (String word : value.split(" ")) {
            if (!result.isEmpty()) result.append(' ');
            result.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
        }
        return result.toString();
    }
}
