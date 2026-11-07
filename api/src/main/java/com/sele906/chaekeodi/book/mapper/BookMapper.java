package com.sele906.chaekeodi.book.mapper;

import com.sele906.chaekeodi.book.domain.Book;
import com.sele906.chaekeodi.book.domain.BookPopularRequest;
import com.sele906.chaekeodi.book.domain.BookPopularItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BookMapper {
    Book getBookByIsbn13(@Param("isbn13") String isbn13);
    void upsertBook(Book book);
    List<BookPopularItem> getPopularBooks(BookPopularRequest bookPopularItem);
    void upsertPopularBook(List<BookPopularItem> books);
}
