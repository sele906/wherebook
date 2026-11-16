package com.sele906.chaekeodi.cache.policy;

import com.sele906.chaekeodi.holding.domain.BookCallNumber;

import java.time.*;

public enum CachePolicy {

    //인기 대출 도서
    //날짜가 키라서 자연 만료, 청소 기준만 필요
    POPULAR_BOOK (Duration.ofDays(3)) {

        @Override
        public OffsetDateTime freshSince() {
            return dailyRefreshSince();
        }
    },

    //도서관 별 소장도서
    HOLDING      (Duration.ofDays(30),  Duration.ofDays(45)),

    // 소장/대출 여부: 매일 반영 시각 기준으로 일괄 만료
    LOAN_STATUS  (Duration.ofDays(3)) {

        @Override
        public OffsetDateTime freshSince() {
            return dailyRefreshSince();
        }
    },

    // 청구기호: 상태별로 유효기간이 다름 (OK는 만료·청소 없음)
    CALL_NUMBER_NOT_FOUND(Duration.ofDays(30), Duration.ofDays(30)),
    CALL_NUMBER_ERROR(Duration.ofDays(3), Duration.ofDays(3));

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    // 정보나루 대출 가능여부 반영 시각 (한국 시간)
    // 근거: 도서관 빅데이터 사무국 문의 답변(2026-11-16)
    //   "통상 오전 9시경 반영, 도서관별 수집 현황에 따라 상이할 수 있음"
    // → 반영 지연 도서관을 고려해 30분 여유
    private static final LocalTime LOAN_STATUS_REFRESH_TIME = LocalTime.of(9, 30);

    private final Duration ttl;        // 이 기간 안이면 신선함
    private final Duration retention;  // 이 기간 지나면 청소

    CachePolicy(Duration ttl, Duration retention) {
        if (retention.compareTo(ttl) < 0) {
            throw new IllegalStateException(name() + ": 청소 기준이 TTL보다 짧음");
        }
        this.ttl = ttl;
        this.retention = retention;
    }

    CachePolicy(Duration retention) {
        if (retention.compareTo(Duration.ofDays(1)) < 0) {
            throw new IllegalStateException(name() + ": 청소 기준이 하루보다 짧음");
        }
        this.ttl = null;
        this.retention = retention;
    }

    // 이 시각 이후에 받은 캐시만 신선함 (기본: 지금 - ttl)
    public OffsetDateTime freshSince() {
        return OffsetDateTime.now().minus(ttl);
    }

    // 이 시각 이전에 받은 캐시는 청소
    public OffsetDateTime expiredBefore() {
        return OffsetDateTime.now().minus(retention);
    }

    public static boolean isFresh(BookCallNumber c) {
        if (c.getFetchedAt() == null) return false;

        return switch (c.getStatus()) {
            case "OK" -> true;
            case "NOT_FOUND" -> c.getFetchedAt().isAfter(CachePolicy.CALL_NUMBER_NOT_FOUND.freshSince());
            default -> c.getFetchedAt().isAfter(CachePolicy.CALL_NUMBER_ERROR.freshSince());
        };
    }

    // 정보나루 일일 반영 시각 기준: 아직 오늘 반영 전이면 어제 반영 시각
    private static OffsetDateTime dailyRefreshSince() {
        ZonedDateTime now = ZonedDateTime.now(SEOUL);
        ZonedDateTime todayRefresh = now.toLocalDate()
                .atTime(LOAN_STATUS_REFRESH_TIME)
                .atZone(SEOUL);
        return (now.isBefore(todayRefresh) ? todayRefresh.minusDays(1) : todayRefresh)
                .toOffsetDateTime();
    }

}
