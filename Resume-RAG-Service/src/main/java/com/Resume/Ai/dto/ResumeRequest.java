package com.Resume.Ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeRequest {

    private UUID userId;

    @NotBlank
    private String resumeName;

    private MultipartFile file;
}
