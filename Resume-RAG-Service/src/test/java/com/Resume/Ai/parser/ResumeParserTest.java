package com.Resume.Ai.parser;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ResumeParserTest {

    private ResumeParser parser;

    @BeforeEach
    void setUp() {
        parser = new ResumeParser();
    }

    @Test
    @DisplayName("Identifies canonical sections")
    void parse_sampleResume_extractsCanonicalSections() {
        String resumeContent = """
                Rahul Kata
                Email: rahul@example.com | Phone: 123-456-7890

                CAREER OBJECTIVE
                Motivated Java Backend Developer.

                EDUCATIONAL QUALIFICATIONS
                B.Tech in CSE, CGPA 8.5

                VIRTUAL EXPERIENCE
                Backend Intern at ACME Corp
                Worked on Spring Boot APIs.

                PERSONAL PROJECTS
                TalentPrep Authentication System
                • Built authentication microservice using Spring Boot.
                • Implemented JWT authentication and refresh tokens.
                Technologies: Java, Spring Boot, Redis, JWT

                TECHNICAL SKILLS & TOOLS
                Languages: Java, SQL, HTML, CSS

                COURSES & CERTIFICATIONS
                AWS Certified Cloud Practitioner

                AWARDS & ACHIEVEMENTS
                1st Place Hackathon Winner

                LANGUAGE PROFICIENCY
                English, Telugu
                """;

        Resource resource = new ByteArrayResource(resumeContent.getBytes());
        ParsedResumeText parsed = parser.parse(resource, "text/plain");
        Map<String, String> sections = parsed.sections();

        assertThat(sections).containsKeys(
                "CONTACT", "SUMMARY", "EDUCATION", "EXPERIENCE", "PROJECTS",
                "SKILLS", "CERTIFICATIONS", "ACHIEVEMENTS", "LANGUAGES");
        assertThat(sections.get("CONTACT")).contains("Rahul Kata").contains("123-456-7890");
        assertThat(sections.get("PROJECTS")).contains("TalentPrep Authentication System");
    }

    @Test
    @DisplayName("Removes duplicated multi-line PDF extraction blocks")
    void parse_duplicateBlocks_areCollapsed() {
        String resumeContent = """
                Rahul Kata
                EDUCATION
                B.Tech | Vignana Bharathi Institute of Technology | CGPA 7.88
                XII | Sri Chaitanya Junior College | 83%
                SSC | Balaji High School | GPA 9.5
                B.Tech | Vignana Bharathi Institute of Technology | CGPA 7.88
                XII | Sri Chaitanya Junior College | 83%
                SSC | Balaji High School | GPA 9.5

                EXPERIENCE
                JP Morgan Chase & Co. - Software Engineering Virtual Experience
                • Completed practical software engineering tasks.
                • Applied programming concepts to financial data processing.
                JP Morgan Chase & Co. - Software Engineering Virtual Experience
                • Completed practical software engineering tasks.
                • Applied programming concepts to financial data processing.
                """;

        ParsedResumeText parsed = parser.parse(
                new ByteArrayResource(resumeContent.getBytes()),
                "text/plain");

        assertThat(parsed.normalizedText())
                .contains("B.Tech | Vignana Bharathi Institute of Technology | CGPA 7.88")
                .contains("JP Morgan Chase & Co. - Software Engineering Virtual Experience");

        assertThat(parsed.sections().get("EDUCATION").split("B.Tech", -1)).hasSize(2);
        assertThat(parsed.sections().get("EXPERIENCE")
                .split("JP Morgan Chase & Co.", -1)).hasSize(2);
    }

    @Test
    @DisplayName("Moves contact URLs out of unrelated sections")
    void parse_contactLines_doNotRemainInCertificationSection() {
        String resumeContent = """
                CERTIFICATIONS
                AWS Educate - Foundations of Prompt Engineering
                JPMorgan Chase & Co. - Software Engineering Virtual Experience
                mailto:rahul@example.com
                https://linkedin.com/in/rahul
                https://github.com/rahul
                """;

        ParsedResumeText parsed = parser.parse(
                new ByteArrayResource(resumeContent.getBytes()),
                "text/plain");

        assertThat(parsed.sections().get("CERTIFICATIONS"))
                .contains("AWS Educate")
                .doesNotContain("linkedin.com")
                .doesNotContain("github.com");

        assertThat(parsed.sections().get("CONTACT"))
                .contains("rahul@example.com")
                .contains("linkedin.com")
                .contains("github.com");
    }
}
