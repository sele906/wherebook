package com.sele906.chaekeodi.holding.domain;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class HoldingLibraryItem {
    private String isbn13;
    private String libCode;
    private String regionCode;
    private String dtlRegionCode;
}
