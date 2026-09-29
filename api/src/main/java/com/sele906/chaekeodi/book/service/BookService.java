package com.sele906.chaekeodi.book.service;

import com.sele906.chaekeodi.book.domain.Book;
import com.sele906.chaekeodi.book.domain.BookSearchRequest;
import com.sele906.chaekeodi.book.domain.BookSearchResponse;
import com.sele906.chaekeodi.book.mapper.BookMapper;
import com.sele906.chaekeodi.common.exception.ResponseNotFoundException;
import com.sele906.chaekeodi.external.Data4LibraryClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookMapper bookMapper;
    private final Data4LibraryClient client;

    public BookSearchResponse searchBooks(BookSearchRequest req) {

        String title = req.getTitle();
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("검색어를 입력하세요");
        }

        var result = client.fetchBooks(title.trim(), req.getPageNo(), req.getPageSize());
        return new BookSearchResponse(result.books(), req.getPageNo(), req.getPageSize(), result.numFound());

    }

    //db에서 캐시 정보 찾은 후 없으면 api에서 불러올것
    public Book getBookDetail(String isbn13) {
        Book book = bookMapper.getBookByIsbn13(isbn13);

        if (book == null) {
            book = client.fetchBookByIsbn13(isbn13)
                    .orElseThrow(() -> new ResponseNotFoundException(
                            "도서 API를 찾을 수 없습니다. isbn13: " + isbn13
                    ));

            bookMapper.upsertBook(book); //db에 캐시
        }

        return book;
    }

}
