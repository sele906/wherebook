package com.sele906.chaekeodi.place.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlaceSearchRequest {
    @Size(max = 200)
    private String keyword;
}
