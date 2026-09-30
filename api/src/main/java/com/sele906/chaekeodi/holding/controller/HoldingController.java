package com.sele906.chaekeodi.holding.controller;

import com.sele906.chaekeodi.book.service.BookService;
import com.sele906.chaekeodi.holding.domain.LibrarySearchByBookRequest;
import com.sele906.chaekeodi.holding.domain.LibrarySearchByBookResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.sele906.chaekeodi.holding.service.HoldingService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class HoldingController {

    private final HoldingService holdingService;

    @GetMapping("/books/{isbn13}/libraries")
    public LibrarySearchByBookResponse searchLibByBook(
            @PathVariable String isbn13,
            @ModelAttribute LibrarySearchByBookRequest request
    ) {
        return holdingService.searchLibByBook(isbn13, request);
    }
}
