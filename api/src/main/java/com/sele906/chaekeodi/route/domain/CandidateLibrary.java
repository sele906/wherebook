package com.sele906.chaekeodi.route.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class CandidateLibrary {
    private String libCode;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private Double distance;
    private String regionCode;
    private String dtlRegionCode;
}
