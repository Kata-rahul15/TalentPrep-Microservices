package com.Resume.Ai.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/health")
    public String GetHealth(){
        return "Resume Service UP and Running";
    }
}
