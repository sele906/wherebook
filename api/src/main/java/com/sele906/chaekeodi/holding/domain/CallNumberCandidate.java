package com.sele906.chaekeodi.holding.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.Objects;

@Getter
@Setter
@AllArgsConstructor
public class CallNumberCandidate {
    private String classNo;
    private String bookCode;
    private String separateShelfName;
    private String shelfLocName;
    private String regDate;

    // 같은 "실제 위치"인지 판단: 청구기호 + 별치 + 배가위치
    public String groupKey() {
        return String.join("|",
                Objects.toString(separateShelfName, ""),
                Objects.toString(shelfLocName, ""),
                Objects.toString(classNo, ""),
                Objects.toString(bookCode, ""));
    }
}