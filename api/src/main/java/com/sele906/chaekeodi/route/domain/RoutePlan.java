package com.sele906.chaekeodi.route.domain;

import java.util.List;

public record RoutePlan(
        Single single,
        List<PlannedStop> stops,
        double totalKm
) {
    public record PlannedStop(String libCode, List<String> isbns) {}

    public record Single(String libCode, double distanceKm, List<String> isbns, List<String> missingIsbns) {}
}