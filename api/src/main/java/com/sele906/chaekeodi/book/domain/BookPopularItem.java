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

    private Integer page = 1;
    private Integer size = 10;

    public int getPage()   { return Math.max(page, 1); }
    public int getSize()   { return Math.min(Math.max(size, 1), 50); }
    public int getOffset() { return (getPage() - 1) * getSize(); }

    public BookPopularItem(OffsetDateTime startDt, OffsetDateTime endDt, Integer page, Integer size) {
        this.startDt = startDt;
        this.endDt = endDt;
        this.page = page;
        this.size = size;
    }

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
