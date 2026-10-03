package com.sele906.chaekeodi.holding.domain;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CallNumberItem {
    private String callNumber;     // "아동 813.7-정67ㅊ"
    private String shelfLocation;
    private int copyCount;
}
