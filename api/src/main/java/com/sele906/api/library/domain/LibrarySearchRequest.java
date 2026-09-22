package com.sele906.api.library.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LibrarySearchRequest {

    private String keyword;
    private String regionCode;
    private String dtlRegionCode;
    private Double latitude;
    private Double longitude;

    private Integer radius = 5000;

    private Integer page = 1;
    private Integer size = 20;

    public int getRadius() { return Math.min(Math.max(radius, 100), 50_000); }
    public int getPage()   { return Math.max(page, 1); }
    public int getSize()   { return Math.min(Math.max(size, 1), 50); }
    public int getOffset() { return (getPage() - 1) * getSize(); }


}
