package com.sele906.api.book.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookSearchItem {
    private String isbn13;
    private String title;
    private String authors;
    private String publisher;
    private String publicationYear;
    private String imageUrl;
    private int loanCount;
}
