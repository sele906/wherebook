package com.sele906.chaekeodi.holding.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@AllArgsConstructor
public class CallNumberCandidate {
    private String classNo;
    private String bookCode;
    private String separateShelfName;
    private String shelfLocName;
    private String regDate;

    // 같은 책꽂이 자리인지 판단하는 키
    public String groupKey() {
        return classNo + " | " + bookCode;
    }
}
