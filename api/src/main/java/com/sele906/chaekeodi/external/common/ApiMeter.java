package com.sele906.chaekeodi.external.common;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;

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

    private final ConcurrentHashMap<UsageKey, AtomicLong> pending = new ConcurrentHashMap<>();

    // 호출할 때는 메모리 카운터만 올림 (DB 접근 없음)
    public void record(String provider, String apiName, String error) {
        pending.computeIfAbsent(new UsageKey(
                        LocalDate.now(ZoneId.of("Asia/Seoul")),
                        provider,
                        apiName,
                        error
                ), k -> new AtomicLong()
                ).incrementAndGet();
    }

    // 5초마다 모아서 한 번에 저장
    @Scheduled(fixedDelay = 5000)
    public void flush() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));

        for (var entry : pending.entrySet()) {
            UsageKey key = entry.getKey();
            long n = entry.getValue().getAndSet(0);   // 꺼내면서 0으로 (원자적)

            if (n > 0) {
                try {
                    mapper.increaseUsage(
                            key.getUsageDate(),
                            key.getProvider(),
                            key.getApiName(),
                            n,
                            key.getError() == null ? 0 : n,
                            key.getError()
                            );
                } catch (Exception e) {
                    entry.getValue().addAndGet(n);    // 저장 실패하면 다음 flush에서 다시 시도
                    log.warn("API 사용량 저장 실패 {} +{}", key, n, e);
                }
            }

            // 지난 날짜 키는 다 비웠으면 정리 (맵이 계속 커지지 않게)
            if (key.getUsageDate().isBefore(today) && entry.getValue().get() == 0) {
                pending.remove(key, entry.getValue());
            }
        }
    }

    @PreDestroy
    public void shutdown() { flush(); }   // 종료할 때 남은 값 저장
}
