package com.sele906.chaekeodi.holding.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class BookCallNumberItem {
    private String libCode;
    private String isbn13;

    private int seq;
    private String classNo;
    private String bookCode;
    private String separateShelfName;
    private String shelfLocName;

    private int copyCount;
    private String latestRegDate;
}
