package com.sele906.chaekeodi.common.exception;

// 요청 값이 틀림 (ISBN13 형식, 빈 검색어, 위치 없음 등) → 400
public class BadRequestException extends RuntimeException {

    // 원인 예외가 없는 경우
    public BadRequestException(String message) {
        super(message);
    }

    // 원인 예외가 있는 경우
    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}
