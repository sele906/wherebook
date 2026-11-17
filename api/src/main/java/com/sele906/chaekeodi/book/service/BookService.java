package com.sele906.chaekeodi.book.service;

import com.sele906.chaekeodi.book.domain.*;
import com.sele906.chaekeodi.book.mapper.BookMapper;
import com.sele906.chaekeodi.cache.policy.CachePolicy;
import com.sele906.chaekeodi.common.exception.BadRequestException;
import com.sele906.chaekeodi.common.exception.ResponseNotFoundException;
import com.sele906.chaekeodi.external.data4library.Data4LibraryClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookService {

    private final BookMapper bookMapper;
    private final Data4LibraryClient client;
    private static final Pattern ISBN13 = Pattern.compile("^97[89]\\d{10}$");

    public BookPopularResponse loanPopularBooks(BookPopularRequest req) {

        ZoneId zone = ZoneId.of("Asia/Seoul");

        // 오늘 날짜
        LocalDate today = LocalDate.now(zone);
        LocalDate weekAgo = today.minusDays(7);

        //최근 7일간 인기대출 기록
        // 날짜를 00:00:00으로 고정한 OffsetDateTime
        OffsetDateTime startDt = weekAgo.atStartOfDay(zone).toOffsetDateTime();
        OffsetDateTime endDt = today.atStartOfDay(zone).toOffsetDateTime();

        //하루 동안 똑같은 기록 보여주는 것이므로 캐시 필요함
        //db 있으면 불러오고 없으면 api 호출
        List<BookPopularItem> all = bookMapper.getPopularBooks(startDt, endDt, CachePolicy.POPULAR_BOOK.freshSince());

        // 전국 7일치 인기대출이 0건이면 정상일 수 없으므로 캐시하지 않고 다음 요청에서 재시도
        if (all.isEmpty()) {
            log.warn("인기도서 0건 응답 startDt={} endDt={}", startDt, endDt);
            all = client.fetchPopularBooks(startDt, endDt, 1, CachePolicy.POPULAR_BOOK_CACHE_SIZE).books();
            if (!all.isEmpty()) {
                bookMapper.upsertPopularBook(all);
            }
        }

        // 요청한 페이지만 잘라서 반환
        int from = Math.min(req.getOffset(), all.size());
        int to = Math.min(req.getOffset() + req.getPageSize(), all.size());

        return new BookPopularResponse(all.subList(from, to), req.getPageNo(), req.getPageSize());
    }

    public BookSearchResponse searchBooks(BookSearchRequest req) {

        String title = req.getTitle();
        if (title == null || title.isBlank()) {
            throw new BadRequestException("검색어를 입력하세요");
        }

        var result = client.fetchBooks(title.trim(), req.getPageNo(), req.getPageSize());
        return new BookSearchResponse(result.books(), req.getPageNo(), req.getPageSize(), result.numFound());

    }

    //db에서 캐시 정보 찾은 후 없으면 api에서 불러올것
    public Book getBookDetail(String isbn13) {

        //isbn 검증
        if (!ISBN13.matcher(isbn13).matches()) {
            throw new BadRequestException("ISBN13 형식이 아닙니다: " + isbn13);
        }

        Book book = bookMapper.getBookByIsbn13(isbn13);

        if (book == null) {
            // 정보나루는 정상 응답했지만 그 ISBN의 책이 없음 → 404
            book = client.fetchBookByIsbn13(isbn13)
                    .orElseThrow(() -> new ResponseNotFoundException(
                            "도서를 찾을 수 없습니다. isbn13: " + isbn13
                    ));

            bookMapper.upsertBook(book); //db에 캐시
        }

        return book;
    }
}
