package com.sele906.chaekeodi.common.exception;

// 형식은 맞지만 없음 (없는 책·도서관, 맞는 도로명주소 없음) → 404
public class ResponseNotFoundException extends RuntimeException {

    // 원인 예외가 없는 경우
    public ResponseNotFoundException(String message) {
        super(message);
    }

    // 원인 예외가 있는 경우
    public ResponseNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
