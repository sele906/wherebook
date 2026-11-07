package com.sele906.chaekeodi.book.domain;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class BookPopularItem {
    private Integer ranking;
    private String isbn13;
    private String title;
    private String authors;
    private String publisher;
    private String publicationYear;
    private String imageUrl;
    private OffsetDateTime startDt;
    private OffsetDateTime endDt;
    private OffsetDateTime fetchedAt;

    public BookPopularItem(Integer ranking, String isbn13, String title, String authors, String publisher, String publicationYear, String imageUrl, OffsetDateTime startDt, OffsetDateTime endDt, OffsetDateTime fetchedAt) {
        this.ranking = ranking;
        this.isbn13 = isbn13;
        this.title = title;
        this.authors = authors;
        this.publisher = publisher;
        this.publicationYear = publicationYear;
        this.imageUrl = imageUrl;
        this.startDt = startDt;
        this.endDt = endDt;
        this.fetchedAt = fetchedAt;
    }

    public BookPopularItem(OffsetDateTime startDt, OffsetDateTime endDt) {
        this.startDt = startDt;
        this.endDt = endDt;
    }
}
