package com.sele906.chaekeodi.library.domain;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LibrarySearchItem {

    private String libCode;
    private String name;

    private String address;
    private String tel;
    private String fax;
    private String homepage;
    private String closedDays;
    private String operatingTime;

    private Double latitude;
    private Double longitude;
    private String dtlRegionCode;
    private Double distance;   // 좌표 없이 검색하면 null
}
