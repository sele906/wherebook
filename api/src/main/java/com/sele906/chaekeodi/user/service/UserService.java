package com.sele906.chaekeodi.user.service;

import com.sele906.chaekeodi.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;

    public UUID joinGuest(String cookieUserId) {

        UUID userId = parseUuid(cookieUserId);

        // 기존 유저
        if (userId != null && userMapper.loginGuest(userId) == 1) {
            return userId;
        }

        // 신규 유저
        UUID newId = UUID.randomUUID();
        userMapper.joinGuest(newId);
        return newId;
    }

    private UUID parseUuid(String value) {
        if (value == null) return null;
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
