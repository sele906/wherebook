package com.sele906.chaekeodi.book.controller;

import com.sele906.chaekeodi.book.domain.Book;
import com.sele906.chaekeodi.book.domain.BookSearchRequest;
import com.sele906.chaekeodi.book.domain.BookSearchResponse;
import com.sele906.chaekeodi.book.service.BookService;
import com.sele906.chaekeodi.holding.domain.LibrarySearchByBookRequest;
import com.sele906.chaekeodi.holding.domain.LibrarySearchByBookResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/books")
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<BookSearchResponse> searchBooks(
            @ModelAttribute BookSearchRequest request
            ) {

        BookSearchResponse response = bookService.searchBooks(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{isbn13}")
    public ResponseEntity<Book> getBookDetail(
            @PathVariable("isbn13") String isbn13
    ) {
        Book response = bookService.getBookDetail(isbn13);
        return ResponseEntity.ok(response);
    }
}
