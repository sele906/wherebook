package com.sele906.chaekeodi.common.exception;

// 외부 API(정보나루·카카오·도로명주소) 호출 실패나 응답 이상 → 502
public class ExternalApiException extends RuntimeException {

    // 원인 예외가 없는 경우
    public ExternalApiException(String message) {
        super(message);
    }

    // 원인 예외가 있는 경우
    public ExternalApiException(String message, Throwable cause) {
        super(message, cause);
    }
}