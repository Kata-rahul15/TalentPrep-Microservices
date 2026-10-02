package com.Application.AuthService.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
public class EmailTemplateService {

    private final TemplateEngine templateEngine;

    public String buildVerifyOtpEmail(String email,String name,String otp){
        Context context = new Context();
        context.setVariable("name",name);
        context.setVariable("otp",otp);
        return templateEngine.process("email/verify-otp",context);
    }

    public String buildResetOtpEmail(String email,String name,String otp){
        Context context = new Context();
        context.setVariable("name",name);
        context.setVariable("otp",otp);
        return templateEngine.process("email/reset-password",context);
    }
    public String buildWelcomeEmail(String email,String name){
        Context context= new Context();
        context.setVariable("name",name);
        return templateEngine.process("email/welcome",context);
    }

}
