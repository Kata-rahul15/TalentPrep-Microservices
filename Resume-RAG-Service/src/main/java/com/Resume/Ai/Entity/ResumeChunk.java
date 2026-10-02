package com.Resume.Ai.Entity;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.*;


@Entity
@Table(name = "resume_chunks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "resume_id")
    private Resume resume;

    private Integer chunkNumber;

    @Column(name = "section")
    private String section;

    @Column(columnDefinition = "TEXT")
    private String chunkText;

    private String embeddingId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
