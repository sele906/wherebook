package com.sele906.chaekeodi.common.controller;

import com.sele906.chaekeodi.common.repository.ConnectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @Autowired
    private ConnectionRepository connectionRepository;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> getHealth() {
        return ResponseEntity.ok(
                Map.of("status", "ok")
        );
    }

    @GetMapping("/db-health")
    public Map<String, Object> dbHealth() {
        Integer result = connectionRepository.connectionTest();

        return Map.of(
                "database", "connected",
                "result", result
        );
    }
}
