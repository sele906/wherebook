package com.sele906.chaekeodi.book.mapper;

import com.sele906.chaekeodi.book.domain.Book;
import com.sele906.chaekeodi.holding.domain.LibrarySearchByBookRequest;
import com.sele906.chaekeodi.library.domain.LibrarySearchItem;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface BookMapper {
    Book getBookByIsbn13(String isbn13);
    void upsertBook(Book book);
}
