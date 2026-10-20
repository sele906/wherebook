package com.sele906.chaekeodi.place.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class PlaceSearchResponse {
    private String name;
    private String address;
    private String category;
}
