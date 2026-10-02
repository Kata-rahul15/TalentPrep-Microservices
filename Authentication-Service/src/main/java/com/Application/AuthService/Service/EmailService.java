package com.Application.AuthService.Service;

import com.Application.AuthService.Dto.BrevoEmailRequest;
import com.Application.AuthService.Dto.Recipient;
import com.Application.AuthService.Dto.Sender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final RestClient restClient;
    private final EmailTemplateService emailTemplateService;

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${brevo.sender.email:katarahul8@gmail.com}")
    private String senderEmail;

    @Value("${brevo.sender.name:TalentPrep}")
    private String senderName;

    public void sendWelcomeEmail(String name, String toEmail) {

        String html = emailTemplateService.buildWelcomeEmail(toEmail, name);

        htmlMailSender(
                toEmail,
                "Welcome to TalentPrep",
                html
        );
    }

    public void sendVerifyOtp(String toEmail, String name, String otp) {

        String html = emailTemplateService.buildVerifyOtpEmail(toEmail, name, otp);

        htmlMailSender(
                toEmail,
                "Verify Your TalentPrep Account",
                html
        );
    }

    public void sendResetOtp(String toEmail, String name, String otp) {

        String html = emailTemplateService.buildResetOtpEmail(toEmail, name, otp);

        htmlMailSender(
                toEmail,
                "Reset Your TalentPrep Password",
                html
        );
    }

    private void htmlMailSender(String toEmail, String subject, String html) {

        BrevoEmailRequest request = BrevoEmailRequest.builder()
                .sender(new Sender(senderEmail, senderName))
                .to(List.of(new Recipient(toEmail)))
                .subject(subject)
                .htmlContent(html)
                .build();
        try {
            restClient.post()
                    .uri("https://api.brevo.com/v3/smtp/email")
                    .header("api-key", apiKey)
                    .header("accept", "application/json")
                    .header("content-type", "application/json")
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Email sent successfully to {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send email to {} : {}", toEmail, e.getMessage());
            throw e;
        }
    }
}