package com.sele906.chaekeodi.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class ExternalApiException extends RuntimeException {

    // 원인 예외가 없는 경우
    public ExternalApiException(String message) {
        super(message);
    }

    public ExternalApiException(String message, Throwable cause) {
        super(message, cause);
    }


}