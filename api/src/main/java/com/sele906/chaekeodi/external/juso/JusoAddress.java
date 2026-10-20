package com.sele906.chaekeodi.external.juso;

import lombok.*;

// 검색 결과 (프론트로 나감)

@Getter
@Setter
@Builder
@AllArgsConstructor
public class JusoAddress {
    private String name;
    private String address;
    private String admCd;
    private String rnMgtSn;
    private String emdNm;
    private String udrtYn;
    private String buldMnnm;
    private String buldSlno;

}
