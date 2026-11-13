package com.sele906.chaekeodi.common.exception;

// 지금 상태로는 할 수 없음 (빌릴 책 최대 권수 초과 등) → 409
public class ConflictException extends RuntimeException {

    // 원인 예외가 없는 경우
    public ConflictException(String message) {
        super(message);
    }

    // 원인 예외가 있는 경우
    public ConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}
