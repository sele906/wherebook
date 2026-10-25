package com.sele906.chaekeodi.route.service;

import com.sele906.chaekeodi.common.util.Combinatorics;
import com.sele906.chaekeodi.common.util.GeoDistance;
import com.sele906.chaekeodi.route.domain.CandidateLibrary;
import com.sele906.chaekeodi.route.domain.RoutePlan;

import java.util.*;

import static com.sele906.chaekeodi.common.util.Combinatorics.combinations;
import static com.sele906.chaekeodi.common.util.Combinatorics.permutations;

public final class RoutePlanner {

    private static final int MAX_STOPS = 3;

    private RoutePlanner() {}

    public static RoutePlan plan(
            double startLat,
            double startLng,
            Map<String, CandidateLibrary> libByCode,
            Map<String, Set<String>> availableByLibrary
    ) {

        // 1. 반경 내에서 대출 가능한 ISBN 수집
        Set<String> availableIsbns = new HashSet<>();

        for (Set<String> isbns : availableByLibrary.values()) {
            availableIsbns.addAll(isbns);
        }

        if (availableIsbns.isEmpty()) {
            return new RoutePlan(null, List.of(), 0);
        }

        // 대출 가능한 책이 있는 도서관만 계산에 포함
        List<String> libCodes = new ArrayList<>(availableByLibrary.keySet());

        // 2. 한 곳만 방문한다면?
        String bestSingle = null;

        for (String code : libCodes) {

            if (bestSingle == null) {
                bestSingle = code;
                continue;
            }

            int cur = availableByLibrary.get(code).size();
            int best = availableByLibrary.get(bestSingle).size();

            boolean closer = distanceFromStart(startLat, startLng, libByCode.get(code)) < distanceFromStart(startLat, startLng, libByCode.get(bestSingle));

            if (cur > best || (cur == best && closer)) {
                bestSingle = code;
            }
        }

        // 3. 대출 가능한 책을 모두 빌리는 경로
        List<String> bestRoute = null;
        double bestLength = Double.MAX_VALUE;

        //경로 계산할 도서관 수 제한
        for (int k = 1; k <= Math.min(MAX_STOPS, libCodes.size()); k++) {

            // 조합: 방문할 도서관 선택
            for (List<String> combo : Combinatorics.combinations(libCodes, k)) {

                if (!coversAll(combo, availableByLibrary, availableIsbns)) {
                    continue;
                }

                // 순열: 방문 순서 결정
                for (List<String> order : Combinatorics.permutations(combo)) {

                    double length = routeLength(
                            startLat, startLng, order, libByCode
                    );

                    if (length < bestLength) {
                        bestLength = length;
                        bestRoute = order;
                    }
                }
            }

            // 최소 방문 도서관 수 우선
            if (bestRoute != null) break;
        }

        // 4. 한 곳만 방문하는 계획
        Set<String> singleIsbns = availableByLibrary.get(bestSingle);

        List<String> missingIsbns = availableIsbns.stream()
                .filter(isbn -> !singleIsbns.contains(isbn))
                .toList();

        RoutePlan.Single single = new RoutePlan.Single(
                bestSingle,
                distanceFromStart(startLat, startLng, libByCode.get(bestSingle)),
                new ArrayList<>(singleIsbns),
                missingIsbns
        );

        // 5. 전체 경로가 없다면
        if (bestRoute == null) {
            return new RoutePlan(single, List.of(), 0);
        }

        // 6. 방문 경로를 PlannedStop으로 변환
        List<RoutePlan.PlannedStop> stops = new ArrayList<>();
        Set<String> assignedIsbns = new HashSet<>();

        for (String libCode : bestRoute) {

            List<String> books = new ArrayList<>();

            for (String isbn : availableByLibrary.get(libCode)) {

                // 이미 앞선 도서관에서 빌릴 책은 제외
                if (assignedIsbns.add(isbn)) {
                    books.add(isbn);
                }
            }

            stops.add(new RoutePlan.PlannedStop(libCode, books));
        }

        return new RoutePlan(single, stops, bestLength);
    }

    // 출발지에서 특정 도서관까지의 거리
    private static double distanceFromStart(
            double startLat,
            double startLng,
            CandidateLibrary lib
    ) {
        return GeoDistance.distanceKm(
                startLat,
                startLng,
                lib.getLatitude(),
                lib.getLongitude()
        );
    }

    // 선택한 도서관들에서 필요한 책을 모두 구할 수 있는지
    private static boolean coversAll(
            List<String> combo,
            Map<String, Set<String>> availableByLibrary,
            Set<String> target
    ) {
        Set<String> covered = new HashSet<>();

        for (String libCode : combo) {
            covered.addAll(availableByLibrary.getOrDefault(libCode, Collections.emptySet()));
        }

        return covered.containsAll(target);
    }

    // 출발지부터 각 도서관까지의 총 직선거리
    private static double routeLength(
            double startLat,
            double startLng,
            List<String> order,
            Map<String, CandidateLibrary> libByCode
    ) {
        double total = 0;
        double lat = startLat;
        double lng = startLng;

        for (String libCode : order) {

            CandidateLibrary lib = libByCode.get(libCode);

            total += GeoDistance.distanceKm(
                    lat,
                    lng,
                    lib.getLatitude(),
                    lib.getLongitude()
            );

            lat = lib.getLatitude();
            lng = lib.getLongitude();
        }

        return total;
    }

}
