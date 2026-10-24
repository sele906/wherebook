package com.sele906.chaekeodi.user.support;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;

@Component
public class GuestCookies {

    public static final String NAME = "userId";

    @Value("${app.cookie.secure:true}")
    private boolean secure;

    public String create(UUID userId) {
        return ResponseCookie.from(NAME, userId.toString())
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ofDays(365))
                .build()
                .toString();
    }
}
