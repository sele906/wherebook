package com.sele906.chaekeodi.place.domain;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlaceSearchRequest {

    @Size(min = 2, max = 40)
    private String keyword;
}
