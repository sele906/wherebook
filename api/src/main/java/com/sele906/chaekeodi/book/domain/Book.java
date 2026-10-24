package com.sele906.chaekeodi.book.domain;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Book {
    private String isbn13;
    private String title;
    private String authors;
    private String publisher;
    private String publicationYear;
    private String classNo;
    private String className;
    private String description;
    private String imageUrl;
    private OffsetDateTime fetchedAt;
}
