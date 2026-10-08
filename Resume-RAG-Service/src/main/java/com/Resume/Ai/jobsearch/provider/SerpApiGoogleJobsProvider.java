package com.Resume.Ai.jobsearch.provider;

import com.Resume.Ai.config.SerpApiProperties;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

@Component
@Primary
public class SerpApiGoogleJobsProvider implements JobSearchProvider {

    private static final Logger log =
            LoggerFactory.getLogger(SerpApiGoogleJobsProvider.class);

    private final RestClient.Builder restClientBuilder;
    private final SerpApiProperties properties;
    private final ObjectMapper mapper;
    private final Environment environment;

    public SerpApiGoogleJobsProvider(
            RestClient.Builder restClientBuilder,
            SerpApiProperties properties,
            ObjectMapper mapper,
            Environment environment) {

        this.restClientBuilder = restClientBuilder;
        this.properties = properties;
        this.mapper = mapper;
        this.environment = environment;
    }

    @Override
    public String providerName() {
        return "serpapi-google-jobs";
    }

    /**
     * Searches Google Jobs through SerpApi.
     *
     * Pagination has intentionally been removed.
     * Every search performs exactly one SerpApi request.
     */
    @Override
    public JsonNode search(
            String query,
            String location,
            Integer days,
            Integer limit) {

        requireKey();

        String q = requireQuery(query);

        int safeLimit = limit == null
                ? 10
                : Math.max(1, Math.min(limit, 50));

        int safeDays = days == null
                ? 30
                : Math.max(1, Math.min(days, 365));

        /*
         * Make exactly ONE request to SerpApi.
         *
         * We do not use next_page_token because SerpApi was returning:
         * "Invalid next_page_token."
         */
        JsonNode raw = executeJobsSearch(q, location);

        ArrayNode accepted = mapper.createArrayNode();

        JsonNode jobs = raw.path("jobs_results");

        if (jobs.isArray()) {

            for (JsonNode job : jobs) {

                if (isWithinDays(job, safeDays)) {
                    accepted.add(normalizeJob(job));
                }

                if (accepted.size() >= safeLimit) {
                    break;
                }
            }
        }

        ObjectNode response = mapper.createObjectNode();

        response.put("provider", providerName());
        response.put("query", q);

        if (location != null && !location.isBlank()) {
            response.put("location", location.trim());
        }

        response.put("days", safeDays);
        response.put("count", accepted.size());

        response.set("jobs", accepted);

        log.info(
                "[SERPAPI] search q='{}' location='{}' days={} limit={} -> {} jobs",
                q,
                location,
                safeDays,
                safeLimit,
                accepted.size()
        );

        return response;
    }

    /**
     * Get a single job by SerpApi job ID.
     */
    @Override
    public JsonNode getJob(String jobId) {

        String apiKey = requireKey();

        if (jobId == null || jobId.isBlank()) {
            throw new IllegalArgumentException("jobId is required.");
        }

        /*
         * SerpApi job IDs can contain encoded information.
         * Try to recover the title/company first and search Google Jobs.
         */
        String recoveryQuery = queryFromJobId(jobId);

        if (recoveryQuery != null) {

            JsonNode raw = executeJobsSearch(
                    recoveryQuery,
                    null
            );

            JsonNode jobs = raw.path("jobs_results");

            if (jobs.isArray()) {

                for (JsonNode job : jobs) {

                    if (jobId.equals(job.path("job_id").asText())) {
                        return wrapJob(job);
                    }
                }
            }
        }

        /*
         * Fallback to SerpApi's listing engine.
         */
        String uri = UriComponentsBuilder
                .fromUriString(properties.getBaseUrl())
                .queryParam(
                        "engine",
                        properties.getListingEngine()
                )
                .queryParam("q", jobId)
                .queryParam("api_key", apiKey)
                .queryParam(
                        "hl",
                        properties.getLanguage()
                )
                .queryParam(
                        "gl",
                        properties.getCountry()
                )
                .build()
                .encode()
                .toUriString();

        JsonNode listing = client()
                .get()
                .uri(uri)
                .retrieve()
                .body(JsonNode.class);

        ObjectNode response = mapper.createObjectNode();

        response.put("provider", providerName());
        response.put("jobId", jobId);

        response.set(
                "details",
                listing == null
                        ? mapper.nullNode()
                        : listing
        );

        return response;
    }

    /**
     * Execute ONE Google Jobs request.
     *
     * IMPORTANT:
     * There is deliberately NO next_page_token here.
     */
    private JsonNode executeJobsSearch(
            String query,
            String location) {

        String apiKey = requireKey();

        UriComponentsBuilder uri =
                UriComponentsBuilder
                        .fromUriString(properties.getBaseUrl())
                        .queryParam(
                                "engine",
                                properties.getEngine()
                        )
                        .queryParam("q", query)
                        .queryParam("api_key", apiKey)
                        .queryParam(
                                "hl",
                                properties.getLanguage()
                        )
                        .queryParam(
                                "gl",
                                properties.getCountry()
                        );

        Optional
                .ofNullable(blankToNull(location))
                .ifPresent(
                        value -> uri.queryParam(
                                "location",
                                value
                        )
                );

        String requestUri = uri
                .build()
                .encode()
                .toUriString();

        log.debug(
                "[SERPAPI] Executing Google Jobs request: q='{}', location='{}'",
                query,
                location
        );

        JsonNode result = client()
                .get()
                .uri(requestUri)
                .retrieve()
                .body(JsonNode.class);

        if (result != null && result.hasNonNull("error")) {

            throw new IllegalStateException(
                    "SerpApi job search failed: "
                            + result.path("error").asText()
            );
        }

        return result == null
                ? mapper.createObjectNode()
                : result;
    }

    /**
     * Converts SerpApi's Google Jobs response into the stable API contract
     * consumed by the TalentPrep frontend. This prevents UI fields such as
     * company, posted_date and work_model from depending on SerpApi's nested
     * field names.
     */
    private ObjectNode normalizeJob(JsonNode job) {
        ObjectNode normalized = mapper.createObjectNode();

        String title = firstText(job, "title", "job_title", "name");
        String company = firstText(job, "company_name", "company", "employer_name");
        String location = firstText(job, "location", "job_location");
        String description = firstText(job, "description", "snippet");

        normalized.put("job_id", firstText(job, "job_id", "id"));
        normalized.put("title", title);
        normalized.put("company", company);
        normalized.put("location", location);
        normalized.put("description", description);

        JsonNode extensions = job.path("detected_extensions");
        String postedDate = firstText(extensions, "posted_at", "posted_date", "date_posted");
        String employmentType = firstText(extensions, "schedule_type", "employment_type");
        String workModel = extensions.path("work_from_home").asBoolean(false)
                ? "Remote"
                : firstText(extensions, "work_model", "work_mode", "schedule_type");

        normalized.put("posted_date", postedDate);
        normalized.put("employment_type", employmentType);
        normalized.put("work_model", workModel);

        JsonNode salary = job.path("detected_extensions").path("salary");
        normalized.put("salary", salary.isMissingNode() || salary.isNull() ? "" : salary.asText(""));

        ArrayNode skills = mapper.createArrayNode();
        JsonNode highlights = job.path("job_highlights");
        if (highlights.isArray()) {
            for (JsonNode highlight : highlights) {
                JsonNode items = highlight.path("items");
                if (items.isArray()) {
                    for (JsonNode item : items) {
                        String value = item.asText("").trim();
                        if (!value.isBlank()) skills.add(value);
                    }
                }
            }
        }
        normalized.set("skills_required", skills);

        String url = "";
        JsonNode applyOptions = job.path("apply_options");
        if (applyOptions.isArray() && !applyOptions.isEmpty()) {
            JsonNode first = applyOptions.get(0);
            url = firstText(first, "link", "url");
        }
        if (url.isBlank()) {
            url = firstText(job, "share_link", "link", "url");
        }
        normalized.put("url", url);

        // Keep the original payload available for debugging/future fields
        // without making the frontend depend on it.
        normalized.set("raw", job);

        return normalized;
    }

    private String firstText(JsonNode node, String... fields) {
        if (node == null) return "";
        for (String field : fields) {
            JsonNode value = node.path(field);
            if (!value.isMissingNode() && !value.isNull()) {
                String text = value.asText("").trim();
                if (!text.isBlank()) return text;
            }
        }
        return "";
    }

    /**
     * Wrap a single job response.
     */
    private ObjectNode wrapJob(JsonNode job) {

        ObjectNode response = mapper.createObjectNode();

        response.put(
                "provider",
                providerName()
        );

        response.set("job", job);

        return response;
    }

    /**
     * Locally filters jobs based on Google's posted_at value.
     *
     * Examples:
     * - "2 hours ago"
     * - "1 day ago"
     * - "3 weeks ago"
     * - "2 months ago"
     */
    private boolean isWithinDays(
            JsonNode job,
            int days) {

        String posted =
                textOrNull(
                        job
                                .path("detected_extensions")
                                .path("posted_at")
                );

        /*
         * If Google doesn't provide the posting date,
         * don't discard the job.
         */
        if (posted == null) {
            return true;
        }

        String s = posted.toLowerCase();

        /*
         * These are definitely recent.
         */
        if (s.contains("hour")
                || s.contains("minute")
                || s.contains("today")
                || s.contains("just")) {

            return true;
        }

        java.util.regex.Matcher matcher =
                java.util.regex.Pattern
                        .compile(
                                "(\\d+)\\s+(day|week|month)s?"
                        )
                        .matcher(s);

        /*
         * Unknown format.
         * Keep the job instead of silently discarding it.
         */
        if (!matcher.find()) {
            return true;
        }

        int number =
                Integer.parseInt(
                        matcher.group(1)
                );

        int ageDays =
                switch (matcher.group(2)) {

                    case "week" ->
                            number * 7;

                    case "month" ->
                            number * 30;

                    default ->
                            number;
                };

        return ageDays <= days;
    }

    /**
     * Attempts to decode information embedded in the SerpApi job ID.
     */
    private String queryFromJobId(String jobId) {

        try {

            String padded =
                    jobId
                            + "=".repeat(
                            (4 - jobId.length() % 4) % 4
                    );

            String json =
                    new String(
                            Base64.getDecoder().decode(padded),
                            StandardCharsets.UTF_8
                    );

            JsonNode node =
                    mapper.readTree(json);

            String title =
                    textOrNull(
                            node.path("job_title")
                    );

            String company =
                    textOrNull(
                            node.path("company_name")
                    );

            if (title == null) {
                return null;
            }

            return company == null
                    ? title
                    : title + " " + company;

        } catch (Exception ignored) {

            return null;
        }
    }

    /**
     * Creates a RestClient from the globally configured builder.
     */
    private RestClient client() {
        return restClientBuilder.build();
    }

    /**
     * Validates the search query.
     */
    private String requireQuery(String value) {

        String q = blankToNull(value);

        if (q == null) {

            throw new IllegalArgumentException(
                    "q is required for Google Jobs search."
            );
        }

        return q;
    }

    /**
     * Resolves the SerpApi key.
     *
     * Supports:
     * 1. Spring property
     * 2. Process environment
     * 3. Spring environment lookup
     *
     * The actual API key is NEVER logged.
     */
    private String requireKey() {

        String boundKey =
                properties.getApiKey();

        String envKey =
                System.getenv("SERPAPI_API_KEY");

        String springEnvKey =
                environment.getProperty(
                        "SERPAPI_API_KEY"
                );

        boolean boundPresent =
                boundKey != null
                        && !boundKey.isBlank();

        boolean rawEnvPresent =
                envKey != null
                        && !envKey.isBlank();

        boolean springEnvPresent =
                springEnvKey != null
                        && !springEnvKey.isBlank();

        log.warn(
                "[SERPAPI-TEMP-DIAGNOSTIC] " +
                        "boundPropertyPresent={} " +
                        "boundPropertyLength={} " +
                        "rawEnvironmentPresent={} " +
                        "rawEnvironmentLength={} " +
                        "springEnvironmentPresent={} " +
                        "springEnvironmentLength={} " +
                        "activeProfiles={}",

                boundPresent,
                safeLength(boundKey),

                rawEnvPresent,
                safeLength(envKey),

                springEnvPresent,
                safeLength(springEnvKey),

                String.join(
                        ",",
                        environment.getActiveProfiles()
                )
        );

        String resolvedKey =
                boundPresent
                        ? boundKey.trim()
                        : (
                        rawEnvPresent
                                ? envKey.trim()
                                : (
                                springEnvPresent
                                        ? springEnvKey.trim()
                                        : null
                        )
                );

        if (resolvedKey == null) {

            throw new IllegalStateException(
                    "SerpApi API key is unavailable at runtime. "
                            + "Temporary diagnostics checked Spring property "
                            + "'job-search.serpapi.api-key' and process environment "
                            + "variable 'SERPAPI_API_KEY'."
            );
        }

        log.info(
                "[SERPAPI-TEMP-DIAGNOSTIC] " +
                        "SerpApi key resolved successfully; length={}",
                resolvedKey.length()
        );

        return resolvedKey;
    }

    private int safeLength(String value) {

        return value == null
                ? 0
                : value.trim().length();
    }

    private String textOrNull(JsonNode node) {

        if (node == null
                || node.isMissingNode()
                || node.isNull()) {

            return null;
        }

        String value = node.asText();

        return value == null || value.isBlank()
                ? null
                : value;
    }

    private String blankToNull(String value) {

        return value == null || value.isBlank()
                ? null
                : value.trim();
    }
}