package com.sele906.chaekeodi.common.exception;

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
