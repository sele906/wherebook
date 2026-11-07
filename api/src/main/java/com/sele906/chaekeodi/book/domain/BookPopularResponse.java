package com.sele906.chaekeodi.book.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookPopularResponse {
    private List<BookPopularItem> books;
    private int page;
    private int size;
}
