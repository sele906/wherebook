package com.sele906.chaekeodi.holding.controller;

import com.sele906.chaekeodi.book.service.BookService;
import com.sele906.chaekeodi.external.Data4LibraryClient;
import com.sele906.chaekeodi.holding.domain.CallNumberResponse;
import com.sele906.chaekeodi.holding.domain.LibrarySearchByBookRequest;
import com.sele906.chaekeodi.holding.domain.LibrarySearchByBookResponse;
import com.sele906.chaekeodi.holding.domain.LoanStatusResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.sele906.chaekeodi.holding.service.HoldingService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class HoldingController {

    private final HoldingService holdingService;

    //소장 도서관 검색
    @GetMapping("/books/{isbn13}/libraries")
    public LibrarySearchByBookResponse searchLibByBook(
            @PathVariable String isbn13,
            @ModelAttribute LibrarySearchByBookRequest request
    ) {
        return holdingService.searchLibByBook(isbn13, request);
    }

    //소장 도서관 당 청구기호 출력(도서관 1곳)
    @GetMapping("/books/{isbn13}/libraries/{libCode}/call-number")
    public CallNumberResponse getCallNumber(
            @PathVariable String isbn13,
            @PathVariable String libCode
    ) {
        return holdingService.getCallNumber(isbn13, libCode);
    }

    //도서 소장/대출가능 여부
    @GetMapping("/books/{isbn13}/libraries/{libCode}/loan-status")
    public LoanStatusResponse getLoanStatus(
            @PathVariable String isbn13,
            @PathVariable String libCode
    ) {
        return holdingService.getLoanStatus(isbn13, libCode);
    }
}
