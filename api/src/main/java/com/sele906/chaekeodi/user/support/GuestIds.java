package com.sele906.chaekeodi.user.support;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class GuestIds {

    public UUID parseUuid(String value) {
        if (value == null) return null;
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
