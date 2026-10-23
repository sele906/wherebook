package com.sele906.chaekeodi.library.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Library {
    private String libCode;
    private String name;
    private String address;
    private String tel;
    private String fax;
    private String homepage;
    private Double latitude;
    private Double longitude;
    private String closedDays;
    private String operatingTime;
    private Integer bookCount;
    private String regionCode;
    private String dtlRegionCode;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
