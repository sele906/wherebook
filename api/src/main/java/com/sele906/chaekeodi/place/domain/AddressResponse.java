package com.sele906.chaekeodi.place.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AddressResponse {
    private String name;
    private String address;
    private String admCd;
    private String rnMgtSn;
    private String emdNm;
    private String udrtYn;
    private String buldMnnm;
    private String buldSlno;
}
