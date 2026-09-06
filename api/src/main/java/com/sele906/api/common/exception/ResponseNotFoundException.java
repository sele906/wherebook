package com.sele906.api.common.exception;

public class ResponseNotFoundException extends RuntimeException {

    public ResponseNotFoundException(String message) {
        super(message);
    }
}
