package com.sele906.chaekeodi.holding.domain;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CallNumberResponse {
    private String status;
    private List<CallNumberItem> items;   // 0번이 대표, OK가 아니면 빈 리스트
}
