package com.sele906.api.book.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookSearchRequest {
    private String title;
    private int pageNo = 1;
    private int pageSize = 20;

    public int getPageNo()   { return Math.max(pageNo, 1); }
    public int getPageSize() { return Math.min(Math.max(pageSize, 1), 50); }
}
