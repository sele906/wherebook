package com.sele906.chaekeodi.holding.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class LoanStatus {
    private boolean bookExists;
    private boolean loanAvailable;
}
