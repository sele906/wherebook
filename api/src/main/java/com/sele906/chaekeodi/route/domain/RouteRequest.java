package com.sele906.chaekeodi.route.domain;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class RouteRequest {
    @NotEmpty @Size(max = 30) List<String> isbns;
    @NotNull private Double latitude;
    @NotNull private Double longitude;
    @Max(5000) private Integer radius;
}
