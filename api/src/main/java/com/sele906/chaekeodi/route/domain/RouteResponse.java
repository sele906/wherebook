package com.sele906.chaekeodi.route.domain;

import java.util.List;

public record RouteResponse(
        allAvailableBooksRoute allAvailableBooksRoute,
        bestSingleLibrary bestSingleLibrary,
        List<BookSummary> onLoanNearby,
        List<BookSummary> notFoundNearby
) {

    public record BookSummary(String isbn13, String title) {}

    public record Stop(int order, String libCode, String libName, double latitude, double longitude, List<BookSummary> books) {}

    public record allAvailableBooksRoute(int borrowableBookCount, double totalKm, List<Stop> stops) {}

    public record bestSingleLibrary(String libCode, String libName, double latitude, double longitude, double distanceKm, List<BookSummary> books, List<BookSummary> unavailableBooks) {}
}
