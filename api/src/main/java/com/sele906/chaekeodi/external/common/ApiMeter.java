package com.sele906.chaekeodi.external.common;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;

/*
 * API 계량기: 외부 API 호출 수를 하루·API별로 api_usage 테이블에 기록
 *
 * 정의
 * - 외부 서버에 HTTP 요청을 1번 보내면 call_count 1번
 * - fail_count는 "API가 우리 요청에 제대로 답하지 못한 경우"만
 *   (HTTP 실패, 응답 없음, 응답 틀이 다름, API 오류 코드)
 * - 응답은 정상인데 내용이 우리 기대와 다른 경우(좌표 없음, 대출 여부가 Y/N 아님 등)는
 *   성공으로 셈. 이건 각 함수에서 ExternalApiException과 로그로 처리
 *
 * 규칙
 * - record()는 각 클라이언트의 공통 호출 함수 finally에서만 부른다 (한 요청이 두 번 세지지 않게)
 * - 새 외부 API를 붙일 때도 공통 호출 함수 하나를 두고 같은 방식으로 기록
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApiMeter {

    public static final String HTTP_ERROR = "HTTP_ERROR";                 // 연결 실패, 타임아웃, 4xx·5xx
    public static final String EMPTY_RESPONSE = "EMPTY_RESPONSE";         // 응답 본문 없음
    public static final String INVALID_RESPONSE = "INVALID_RESPONSE";     // 응답 구조가 예상과 다름
    public static final String API_RESPONSE_ERROR = "API_RESPONSE_ERROR"; // API가 오류 코드를 돌려줌

    private final ApiUsageMapper mapper;

    public void record(String provider, String apiName, String error) {
        try {
            mapper.increaseUsage(
                    LocalDate.now(ZoneId.of("Asia/Seoul")),
                    provider,
                    apiName,
                    error == null ? 0 : 1,
                    error
            );
        } catch (Exception e) {
            // 기록 실패가 API 응답까지 망치지 않도록 로그만 남김
            log.warn("API 사용량 기록 실패 {} {}", provider, apiName, e);
        }
    }
}
