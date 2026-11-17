package com.sele906.chaekeodi.cache.scheduler;

import com.sele906.chaekeodi.book.domain.BookPopularRequest;
import com.sele906.chaekeodi.book.service.BookService;
import com.sele906.chaekeodi.cache.mapper.CacheCleanupMapper;
import com.sele906.chaekeodi.cache.policy.CachePolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

@Slf4j
@Component
@RequiredArgsConstructor
public class CacheCleanupScheduler {

    private final CacheCleanupMapper mapper;
    private final BookService bookService;

    //기준 시각 경계와 서버 간 시계 차이를 피해서 캐시 기준 시각인 9시 30분 피하기
    @Scheduled(cron = "0 35 9 * * *", zone = "Asia/Seoul")
    public void warmPopularBooks() {

        long start = System.currentTimeMillis();

        try {
            bookService.loanPopularBooks(new BookPopularRequest(CachePolicy.POPULAR_BOOK_CACHE_SIZE));
            log.info("인기도서 워밍 완료");
        } catch (Exception e) {
            log.warn("인기도서 워밍 실패", e);
        } finally {
            long elapsed = System.currentTimeMillis() - start;
            log.info("인기도서 워밍 소요 {}ms", elapsed);
        }
    }

    @Scheduled(cron = "0 0 4 * * *", zone = "Asia/Seoul")
    public void cleanup() {
        run("popular_book",   () -> mapper.deletePopularBooks(CachePolicy.POPULAR_BOOK.expiredBefore()));
        run("holding_region", () -> mapper.deleteHoldingRegions(CachePolicy.HOLDING.expiredBefore()));
        run("holding_library",() -> mapper.deleteHoldingLibraries(CachePolicy.HOLDING.expiredBefore()));
        run("book_status",    () -> mapper.deleteBookStatuses(CachePolicy.LOAN_STATUS.expiredBefore()));
        run("call_number(NOT_FOUND)", () -> mapper.deleteCallNumbers("NOT_FOUND", CachePolicy.CALL_NUMBER_NOT_FOUND.expiredBefore()));
        run("call_number(ERROR)",     () -> mapper.deleteCallNumbers("ERROR", CachePolicy.CALL_NUMBER_ERROR.expiredBefore()));
    }

    private void run(String table, Supplier<Integer> delete) {
        try {
            int count = delete.get();
            log.info("캐시 청소 table={} deleted={}", table, count);
        } catch (Exception e) {
            log.warn("캐시 청소 실패 table={}", table, e);
        }
    }

}
