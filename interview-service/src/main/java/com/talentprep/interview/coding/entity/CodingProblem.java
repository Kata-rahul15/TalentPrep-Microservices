package com.talentprep.interview.coding.entity;

import com.talentprep.interview.entity.enums.DifficultyLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "coding_problems")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodingProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DifficultyLevel difficulty;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "input_format", columnDefinition = "TEXT")
    private String inputFormat;

    @Column(name = "output_format", columnDefinition = "TEXT")
    private String outputFormat;

    @Column(columnDefinition = "TEXT")
    private String constraints;

    /**
     * Map of language -> starter code boilerplate:
     * {"java": "...", "python": "...", "cpp": "...", "javascript": "..."}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "starter_code", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, String> starterCode = new HashMap<>();

    /**
     * Visible sample test cases shown to candidate:
     * [{"input": "...", "expectedOutput": "...", "description": "..."}]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sample_test_cases", columnDefinition = "jsonb")
    @Builder.Default
    private List<Map<String, Object>> sampleTestCases = new ArrayList<>();

    /**
     * Hidden test cases evaluated only during judging:
     * [{"input": "...", "expectedOutput": "...", "weight": 1}]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "hidden_test_cases", columnDefinition = "jsonb")
    @Builder.Default
    private List<Map<String, Object>> hiddenTestCases = new ArrayList<>();

    /** Driver code for languages if candidate only provides class/method */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "driver_code", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, String> driverCode = new HashMap<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
