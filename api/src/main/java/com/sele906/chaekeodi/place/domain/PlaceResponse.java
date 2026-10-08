package com.sele906.chaekeodi.place.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@AllArgsConstructor
@ToString
public class PlaceResponse {
    private String name;
    private String address;
    private String category;
    private Double latitude;
    private Double longitude;
}
