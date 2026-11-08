package com.sele906.chaekeodi.holding.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@ToString
public class LibrarySearchByBookRequest {
    private String regionCode;
    private String dtlRegionCode;

    private Double latitude;
    private Double longitude;
    private Integer radius = 10000;
    private List<String> libCodes;

    public int getRadius() { return Math.min(Math.max(radius, 100), 50_000); }
}
