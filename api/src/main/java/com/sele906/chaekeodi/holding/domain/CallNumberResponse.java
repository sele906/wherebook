package com.sele906.chaekeodi.holding.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@AllArgsConstructor
@ToString
public class CallNumberResponse {
    private String callNumber;      // "813.7-정67ㅊ"
    private String shelfLocation;   // 배가 위치
    private String status;
}
