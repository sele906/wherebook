package com.sele906.chaekeodi.book.mapper;

import com.sele906.chaekeodi.book.domain.Book;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface BookMapper {
    Book getBookByIsbn13(String isbn13);
    void upsertBook(Book book);
}
