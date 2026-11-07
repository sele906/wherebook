package com.sele906.chaekeodi.book.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookPopularRequest {
    private OffsetDateTime startDt;
    private OffsetDateTime endDt;
    private int pageNo = 1;
    private int pageSize = 20;

    public int getPageNo()   { return Math.max(pageNo, 1); }
    public int getPageSize() { return Math.min(Math.max(pageSize, 1), 50); }
    public int getOffset() { return (getPageNo() - 1) * getPageSize(); }
}
