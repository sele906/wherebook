package com.sele906.chaekeodi.holding.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@AllArgsConstructor
@ToString
public class LoanStatus {
    private boolean bookExists;
    private boolean loanAvailable;
}
