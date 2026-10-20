package com.sele906.chaekeodi.place.domain;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Setter
@Getter
@Builder
@AllArgsConstructor
public class PlaceCoordRequest {

    private String name;
    @NotBlank private String address;
    @NotBlank private String admCd;
    @NotBlank private String rnMgtSn;
    @NotBlank private String udrtYn;
    @NotBlank private String buldMnnm;
    @NotBlank private String buldSlno;
}