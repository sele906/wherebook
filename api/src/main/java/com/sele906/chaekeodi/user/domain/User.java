package com.sele906.chaekeodi.user.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.Date;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class User {
    private UUID userId;
    private String userType;
    private OffsetDateTime createdAt;
    private OffsetDateTime lastSeenAt;
}
