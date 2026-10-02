package com.Resume.Ai.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateJobDescriptionRequest {

    /**
     * Optional.
     * A JD may not explicitly contain a job title.
     */
    @Size(max = 255, message = "title must not exceed 255 characters.")
    private String title;

    /**
     * Optional.
     * A JD may not contain a company name.
     */
    @Size(max = 255, message = "companyName must not exceed 255 characters.")
    private String companyName;

    /**
     * Optional individually.
     *
     * At least one of title, companyName, or description
     * must contain meaningful information.
     */
    @Size(max = 50000, message = "description must not exceed 50,000 characters.")
    private String description;
}