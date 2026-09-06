package com.sele906.api.library.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private Double distance;
    private Date createdAt;
    private Date updatedAt;
}
