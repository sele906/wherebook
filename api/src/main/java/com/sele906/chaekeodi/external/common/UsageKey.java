package com.sele906.chaekeodi.external.common;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class UsageKey {
    private LocalDate usageDate;
    private String provider;
    private String apiName;
    private String error;
}
