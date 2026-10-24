package com.sele906.chaekeodi.book.mapper;

import com.sele906.chaekeodi.book.domain.Book;
import com.sele906.chaekeodi.holding.domain.LibrarySearchByBookRequest;
import com.sele906.chaekeodi.library.domain.LibrarySearchItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.UUID;

@Mapper
public interface BookMapper {
    Book getBookByIsbn13(@Param("isbn13") String isbn13);
    void upsertBook(Book book);
}
