package com.sele906.chaekeodi.user.controller;

import com.sele906.chaekeodi.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/guest")
public class UserController {

    private final UserService userService;

    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    @PostMapping
    public ResponseEntity<String> joinGuest(
            @CookieValue(value = "userId", required = false) String cookieUserId
    ) {

        UUID userId = userService.joinGuest(cookieUserId);

        ResponseCookie cookie = ResponseCookie.from("userId", userId.toString())
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ofDays(365))
                .build();

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }
}
