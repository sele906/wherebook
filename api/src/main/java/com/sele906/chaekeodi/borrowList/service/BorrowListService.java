package com.sele906.chaekeodi.borrowList.service;

import com.sele906.chaekeodi.book.domain.Book;
import com.sele906.chaekeodi.book.mapper.BookMapper;
import com.sele906.chaekeodi.book.service.BookService;
import com.sele906.chaekeodi.borrowList.domain.BorrowListItem;
import com.sele906.chaekeodi.borrowList.mapper.BorrowListMapper;
import com.sele906.chaekeodi.common.exception.ResponseNotFoundException;
import com.sele906.chaekeodi.external.data4library.Data4LibraryClient;
import com.sele906.chaekeodi.user.support.GuestIds;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BorrowListService {

    private final BorrowListMapper borrowlistMapper;

    public List<BorrowListItem> getBorrowList(UUID userId) {
        return borrowlistMapper.getBorrowListByUserId(userId);
    }
    
    public void addBorrowList(String isbn13, UUID userId) {
        //빌릴책 db에 넣기
        borrowlistMapper.addItem(isbn13, userId);
    }

    public void deleteBorrowList(String isbn13, UUID userId) {
        //빌릴책 db에서 삭제
        borrowlistMapper.deleteItem(isbn13, userId);
    }
}
