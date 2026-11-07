package com.sele906.chaekeodi.book.service;

import com.sele906.chaekeodi.book.domain.*;
import com.sele906.chaekeodi.book.mapper.BookMapper;
import com.sele906.chaekeodi.common.exception.ResponseNotFoundException;
import com.sele906.chaekeodi.external.data4library.Data4LibraryClient;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookMapper bookMapper;
    private final Data4LibraryClient client;
    private static final Pattern ISBN13 = Pattern.compile("^97[89]\\d{10}$");

    public BookPopularResponse loanPopularBooks(BookLoanPopularRequest req) {

        ZoneId zone = ZoneId.of("Asia/Seoul");

        // 오늘 날짜
        LocalDate today = LocalDate.now(zone);
        LocalDate weekAgo = today.minusDays(7);

        //최근 7일간 인기대출 기록
        // 날짜를 00:00:00으로 고정한 OffsetDateTime
        OffsetDateTime startDt = weekAgo.atStartOfDay(zone).toOffsetDateTime();
        OffsetDateTime endDt = today.atStartOfDay(zone).toOffsetDateTime();

        req.setStartDt(startDt);
        req.setEndDt(endDt);

        //하루 동안 똑같은 기록 보여주는 것이므로 캐시 필요함
        //db 있으면 불러오고 없으면 api 호출

        List<BookPopularItem> books = bookMapper.getPopularBooks(new BookPopularItem(startDt, endDt, req.getPageNo(), req.getPageSize()));

        if (books == null || books.isEmpty()) {
            var result = client.fetchPopularBooks(req.getStartDt(), req.getEndDt(), req.getPageNo(), req.getPageSize());
            books = result.books();

            if (!books.isEmpty()) {
                bookMapper.upsertPopularBook(books); //db에 캐시
            }
        }

        return new BookPopularResponse(books, req.getPageNo(), req.getPageSize());
    }

    public BookSearchResponse searchBooks(BookSearchRequest req) {

        String title = req.getTitle();
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("검색어를 입력하세요");
        }

        var result = client.fetchBooks(title.trim(), req.getPageNo(), req.getPageSize());
        return new BookSearchResponse(result.books(), req.getPageNo(), req.getPageSize(), result.numFound());

    }

    //db에서 캐시 정보 찾은 후 없으면 api에서 불러올것
    public Book getBookDetail(String isbn13) throws IllegalArgumentException {

        //isbn 검증
        if (!ISBN13.matcher(isbn13).matches()) {
            throw new IllegalArgumentException("ISBN13 형식이 아닙니다: " + isbn13);
        }

        Book book = bookMapper.getBookByIsbn13(isbn13);

        if (book == null) {
            book = client.fetchBookByIsbn13(isbn13)
                    .orElseThrow(() -> new ResponseNotFoundException (
                            "도서 API를 찾을 수 없습니다. isbn13: " + isbn13
                    ));

            bookMapper.upsertBook(book); //db에 캐시
        }

        return book;
    }
}
