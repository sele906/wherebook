package com.sele906.chaekeodi.holding.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.OffsetDateTime;
import java.util.Date;

@Getter
@Setter
@ToString
public class BookCallNumber {
    private String libCode;
    private String isbn13;
    private String status;        // OK / NOT_FOUND / ERROR
    private OffsetDateTime fetchedAt;
}