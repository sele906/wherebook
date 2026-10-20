package com.sele906.chaekeodi.place.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class PlaceCoordResponse {
    private String name;
    private String address;
    private double latitude;
    private double longitude;
}
