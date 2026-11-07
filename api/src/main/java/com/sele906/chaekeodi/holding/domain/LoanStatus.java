package com.sele906.chaekeodi.holding.domain;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class LoanStatus {
    private String isbn13;
    private String libCode;
    private boolean bookExists;
    private boolean loanAvailable;
}
