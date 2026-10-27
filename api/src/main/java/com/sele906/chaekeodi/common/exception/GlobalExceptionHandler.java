package com.sele906.chaekeodi.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    //외부 api 오류?
    @ExceptionHandler(ExternalApiException.class)
    public ResponseEntity<ErrorResponse> externalApiException(ExternalApiException e) {
        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_GATEWAY.value(),
                "도서관 정보 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
        );

        return ResponseEntity
                .status(HttpStatus.BAD_GATEWAY)
                .body(response);
    }

    // 형식은 맞지만 없음 (책·도서관) → 404
    @ExceptionHandler(ResponseNotFoundException.class)
    public ResponseEntity<ErrorResponse> responseNotFound(ResponseNotFoundException e) {
        return error(HttpStatus.NOT_FOUND, e.getMessage());
    }

    // 형식이 틀림 (ISBN13 등) → 400
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> badRequest(IllegalArgumentException e) {
        return error(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    // 요청 파라미터 검증 실패 → 400
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBind(BindException e) {
        return error(HttpStatus.BAD_REQUEST, "검색어는 200자 이하로 입력해 주세요.");
    }

    private ResponseEntity<ErrorResponse> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new ErrorResponse(status.value(), message));
    }
}
