package com.sele906.api.book.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

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
    OffsetDateTime fetchedAt;
}
