package com.sele906.chaekeodi.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

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
