package com.sele906.chaekeodi.user.controller;

import com.sele906.chaekeodi.user.service.UserService;
import com.sele906.chaekeodi.user.support.GuestCookies;
import com.sele906.chaekeodi.user.support.GuestIds;
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

    private final GuestCookies guestCookies;
    private final GuestIds guestIds;

    @PostMapping
    public ResponseEntity<Void> joinGuest(
            @CookieValue(value = GuestCookies.NAME, required = false) String cookieUserId
    ) {

        UUID parseUserId = guestIds.parseUuid(cookieUserId);
        UUID userId = userService.joinGuest(parseUserId);

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, guestCookies.create(userId))
                .build();
    }
}
