package com.sele906.chaekeodi.borrowList.controller;

import com.sele906.chaekeodi.book.domain.BookSearchResponse;
import com.sele906.chaekeodi.book.service.BookService;
import com.sele906.chaekeodi.borrowList.domain.BorrowListItem;
import com.sele906.chaekeodi.borrowList.service.BorrowListService;
import com.sele906.chaekeodi.common.exception.ResponseNotFoundException;
import com.sele906.chaekeodi.user.service.UserService;
import com.sele906.chaekeodi.user.support.GuestCookies;
import com.sele906.chaekeodi.user.support.GuestIds;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/borrow-list")
public class BorrowListController {

    private final UserService userService;
    private final BorrowListService borrowListService;
    private final BookService bookService;

    private final GuestCookies guestCookies;
    private final GuestIds guestIds;

    @GetMapping
    public ResponseEntity<List<BorrowListItem>> getBorrowList(
            @CookieValue(value = GuestCookies.NAME, required = false) String cookieUserId
    ) {
        UUID userId = guestIds.parseUuid(cookieUserId);

        if (userId == null) {
            return ResponseEntity.ok(List.of());
        }

        List<BorrowListItem> response = borrowListService.getBorrowList(userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{isbn13}")
    public ResponseEntity<Void> addBorrowList(
            @PathVariable("isbn13") String isbn13,
            @CookieValue(value = GuestCookies.NAME, required = false) String cookieUserId
    ) throws IllegalArgumentException {

        //책 정보 캐시
        bookService.getBookDetail(isbn13);

        //빌릴책 목록에 추가
        UUID parseUserId = guestIds.parseUuid(cookieUserId);
        UUID userId = userService.joinGuest(parseUserId);
        borrowListService.addBorrowList(isbn13, userId);

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, guestCookies.create(userId))
                .build();
    }

    @DeleteMapping("/{isbn13}")
    public ResponseEntity<Void> deleteBorrowList(
            @PathVariable("isbn13") String isbn13,
            @CookieValue(value = GuestCookies.NAME, required = false) String cookieUserId
    ) {
        //빌릴책 목록에서 삭제
        UUID userId = guestIds.parseUuid(cookieUserId);

        if (userId != null) {
            borrowListService.deleteBorrowList(isbn13, userId);
        }

        return ResponseEntity.noContent().build();
    }
}
