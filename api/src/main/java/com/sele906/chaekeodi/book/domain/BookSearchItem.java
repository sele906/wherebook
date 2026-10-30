package com.sele906.chaekeodi.book.domain;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class BookSearchItem {
    private String isbn13;
    private String title;
    private String authors;
    private String publisher;
    private String publicationYear;
    private String imageUrl;
    private int loanCount;
}
