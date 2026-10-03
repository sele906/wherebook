package com.sele906.chaekeodi.holding.domain;

import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
public class BookCallNumber {
    private String libCode;
    private String isbn13;
    private String status;        // OK / NOT_FOUND / ERROR
    private Date fetchedAt;
}