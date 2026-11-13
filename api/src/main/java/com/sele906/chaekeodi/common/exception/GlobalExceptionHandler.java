package com.sele906.chaekeodi.common.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/*
 * 어떤 예외를 던질지:
 * 1. 요청 값이 틀렸나? (형식·필수 값)           → 400 BadRequestException
 * 2. 요청은 맞는데 찾는 게 없나?                → 404 ResponseNotFoundException
 * 3. 지금 상태라서 안 되나? (상태가 바뀌면 성공) → 409 ConflictException
 * 4. 외부 API가 실패했거나 응답이 이상한가?      → 502 ExternalApiException
 * 5. 우리 코드 버그                             → 500 (따로 안 잡음)
 *
 * 헷갈릴 때
 * - 400 vs 404: 값만 보고 틀린 걸 알면 400, 조회해 봐야 없는 걸 알면 404
 * - 404 vs 502: 외부 API가 정상적으로 "없다"고 하면 404, 답을 못 하거나 이상하면 502
 * - 400 vs 409: 언제 보내도 실패하면 400, 상태가 바뀌면 성공하면 409
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<ErrorResponse> error(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(
                new ErrorResponse(
                        status.value(),
                        code,
                        message
                ));
    }

    //외부 api 오류
    @ExceptionHandler(ExternalApiException.class)
    public ResponseEntity<ErrorResponse> externalApiException(ExternalApiException e) {

        log.debug("외부 API 오류", e);

        return error(
                HttpStatus.BAD_GATEWAY,
                "EXTERNAL_API_ERROR",
                "외부 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요."
        );
    }

    // 형식은 맞지만 없음 (책·도서관) → 404
    @ExceptionHandler(ResponseNotFoundException.class)
    public ResponseEntity<ErrorResponse> responseNotFound(ResponseNotFoundException e) {

        log.debug("리소스 오류", e);

        return error(
                HttpStatus.NOT_FOUND,
                "RESPONSE_NOT_FOUND_ERROR",
                "요청하신 정보를 찾을 수 없습니다."
        );
    }

    // 지금 상태로는 할 수 없음 (빌릴 책 최대 권수 초과 등) → 409
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> conflict(ConflictException e) {

        log.debug("상태 오류", e);

        return error(
                HttpStatus.CONFLICT,
                "RESOURCE_CONFLICT",
                "현재 상태에서는 요청을 처리할 수 없습니다."
        );
    }

    // 형식이 틀림 (ISBN13 등) → 400
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> badRequest(BadRequestException e) {

        log.debug("형식 오류", e);

        return error(
                HttpStatus.BAD_REQUEST,
                "INVALID_REQUEST",
                "요청한 정보가 올바르지 않습니다."
        );
    }

    // 요청 파라미터 검증 실패 → 400
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBind(BindException e) {

        log.debug("요청 파라미터 오류", e);

        return error(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                "입력한 내용을 확인해 주세요."
        );
    }
}
