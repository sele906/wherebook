package com.sele906.api.library.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LibrarySearchRequest {

    private String keyword;

    private Double latitude;
    private Double longitude;

    private Integer radius = 5000;

    private Integer page = 1;
    private Integer size = 20;

    public int getOffset() {
        return (page - 1) * size;
    }

}
