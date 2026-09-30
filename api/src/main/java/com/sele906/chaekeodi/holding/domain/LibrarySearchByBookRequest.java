package com.sele906.chaekeodi.holding.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LibrarySearchByBookRequest {
    private String region;

    private Double latitude;
    private Double longitude;
    private Integer radius = 10000;
    private String libCodes;

    public int getRadius() { return Math.min(Math.max(radius, 100), 50_000); }
}
