package com.sele906.api.book.controller;

import com.sele906.api.book.domain.Book;
import com.sele906.api.book.domain.BookSearchRequest;
import com.sele906.api.book.domain.BookSearchResponse;
import com.sele906.api.book.service.BookService;
import com.sele906.api.library.domain.Library;
import com.sele906.api.library.service.LibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
