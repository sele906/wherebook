package com.sele906.chaekeodi.borrowList.domain;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class BorrowListItem {
    private String isbn13;
    private String imageUrl;
    private String title;
    private String authors;
    private String publisher;
    private String publicationYear;
    private OffsetDateTime addedAt;
}
