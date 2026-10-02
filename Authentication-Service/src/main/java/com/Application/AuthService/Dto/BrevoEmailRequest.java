package com.Application.AuthService.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BrevoEmailRequest {

    private Sender sender;

    private List<Recipient> to;

    private String subject;

    private String htmlContent;
}