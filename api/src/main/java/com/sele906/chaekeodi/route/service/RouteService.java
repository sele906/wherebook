package com.sele906.chaekeodi.route.service;

import com.sele906.chaekeodi.holding.domain.LoanStatus;
import com.sele906.chaekeodi.holding.domain.Region;
import com.sele906.chaekeodi.holding.service.HoldingService;
import com.sele906.chaekeodi.holding.domain.BookLib;
import com.sele906.chaekeodi.route.domain.*;
import com.sele906.chaekeodi.route.mapper.RouteMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteMapper routeMapper;
    private final HoldingService holdingService;

    public RouteResponse getCalcRoute(RouteRequest request) {

        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new IllegalArgumentException("경로 계산에는 위치 정보가 필요합니다.");
        }

        List<String> borrowList = request.getIsbns();

        // 1. 사용자 반경 내 도서관 조회
        List<CandidateLibrary> libraries = routeMapper.searchLibraries(request);

        if (libraries.isEmpty()) {
            return new RouteResponse(null, null, List.of(), toBookSummaries(borrowList), List.of());
        }

        // 2. 반경 내 도서관의 지역 코드 수집 (중복 제거)
        Set<Region> regions = new HashSet<>();

        for (CandidateLibrary lib : libraries) {

            String regionCode = lib.getRegionCode();
            String dtlRegionCode = lib.getDtlRegionCode();

            if (regionCode != null && dtlRegionCode != null) {
                Region region = new Region(regionCode, dtlRegionCode);
                regions.add(region);
            }
        }

        // 3. 반경 내 도서관 코드 수집 (중복 제거)
        Set<String> candidateLibraryCodes = new HashSet<>();

        for (CandidateLibrary lib : libraries) {
            String libCode = lib.getLibCode();
            candidateLibraryCodes.add(libCode);
        }

        // 4. 도서관별 소장 ISBN 목록
        // 반경 내 도서관에서 찾은 대출가능 ISBN 목록
        Map<String, Set<String>> availableByLibrary = new HashMap<>();

//        availableByLibrary 예시
//        A 도서관 -> isbn A, isbn B , ...
//        B 도서관 -> isbn B, isbn C , ...
//        C 도서관 -> isbn C, ...

        // 반경 내에 소장은 하지만 전부 대출 중인 ISBN
        List<String> isbnsOnLoanNearby = new ArrayList<>();

        // 반경 내 도서관에서 찾지 못한 ISBN 목록
        List<String> isbnsnotFoundNearbyNearby = new ArrayList<>();

        // 5. 빌릴 책들 조회
        // 5-1. 중복 ISBN 제거
        List<String> uniqueIsbns = borrowList.stream().distinct().toList();

        // 소장 도서관 캐시 조회
        Map<String, List<String>> holdings = holdingService.getHoldingLibCodes(uniqueIsbns, new ArrayList<>(regions));

        // 5-2. 대출 상태 조회 대상 생성
        Set<BookLib> keys = new HashSet<>();

        for (String isbn : uniqueIsbns) {
            List<String> libCodes = holdings.getOrDefault(isbn, List.of());

            for (String libCode : libCodes) {
                // 사용자 반경 내 도서관만 확인
                if (!candidateLibraryCodes.contains(libCode)) { continue; }
                keys.add(new BookLib(isbn, libCode));
            }
        }

        // 대출 상태 캐시 조회
        Map<BookLib, LoanStatus> statuses = holdingService.getLoanStatuses(keys);

        // 5-3. ISBN별 대출 상태 분류
        for (String isbn : uniqueIsbns) {

            boolean availableNearby = false;
            boolean heldNearby = false;

            List<String> libCodes = holdings.getOrDefault(isbn, List.of());

            // 중복 도서관 코드 제거
            for (String libCode : new LinkedHashSet<>(libCodes)) {

                if (!candidateLibraryCodes.contains(libCode)) continue;

                BookLib key = new BookLib(isbn, libCode);

                // 이미 요청한 대출 상태 조회 결과
                LoanStatus s = statuses.get(key);

                if (s == null || !s.isBookExists()) { continue; }

                heldNearby = true;

                if (s.isLoanAvailable()) {

                    // 도서관별 대출 가능한 ISBN 저장
                    availableByLibrary
                            .computeIfAbsent(libCode, k -> new HashSet<>())
                            .add(isbn);

                    availableNearby = true;
                }
            }

            // 모든 도서관을 확인한 뒤 책 분류
            if (!availableNearby) {
                if (heldNearby) {
                    isbnsOnLoanNearby.add(isbn);
                } else {
                    isbnsnotFoundNearbyNearby.add(isbn);
                }
            }
        }

        // 도서관 코드로 정보 조회
        Map<String, CandidateLibrary> libByCode = new HashMap<>();
        for (CandidateLibrary lib : libraries) {
            libByCode.put(lib.getLibCode(), lib);
        }

        //경우의 수 + 경로 계산
        RoutePlan plan = RoutePlanner.plan(request.getLatitude(), request.getLongitude(), libByCode, availableByLibrary);

        return toResponse(
                plan,
                libByCode,
                isbnsOnLoanNearby,
                isbnsnotFoundNearbyNearby,
                plan.uncoveredBooks()
        );
    }

    private RouteResponse toResponse(
            RoutePlan plan,
            Map<String, CandidateLibrary> libByCode,
            List<String> onLoanNearby,
            List<String> notFoundNearby,
            List<String> uncoveredBooks
    ) {

        // 1. 한 곳만 방문하는 계획
        RouteResponse.bestSingleLibrary bestSingleLibrary = null;

        if (plan.single() != null) {

            RoutePlan.Single single = plan.single();
            CandidateLibrary lib = libByCode.get(single.libCode());

            // 한 도서관에서 빌리지 못하는 책
            // 다른 도서관에서 대출 가능하거나, 주변에 없거나, 대출 중인 책
            Set<String> missing = new LinkedHashSet<>(single.missingIsbns());
            missing.addAll(onLoanNearby);
            missing.addAll(notFoundNearby);

            bestSingleLibrary = new RouteResponse.bestSingleLibrary(
                    lib.getLibCode(),
                    lib.getName(),
                    lib.getLatitude(),
                    lib.getLongitude(),
                    single.distanceKm(),
                    toBookSummaries(single.isbns()),
                    toBookSummaries(missing)
            );
        }

        // 2. 전체 방문 경로
        RouteResponse.allAvailableBooksRoute allAvailableBooksRoute = null;

        if (plan.stops() != null && !plan.stops().isEmpty()) {

            List<RouteResponse.Stop> stops = new ArrayList<>();

            int order = 1;
            int borrowableBookCount = 0;

            for (RoutePlan.PlannedStop stop : plan.stops()) {

                CandidateLibrary lib = libByCode.get(stop.libCode());

                stops.add(new RouteResponse.Stop(
                        order++,
                        lib.getLibCode(),
                        lib.getName(),
                        lib.getLatitude(),
                        lib.getLongitude(),
                        toBookSummaries(stop.isbns())
                ));

                borrowableBookCount += stop.isbns().size();
            }

            allAvailableBooksRoute = new RouteResponse.allAvailableBooksRoute(
                    borrowableBookCount,
                    plan.totalKm(),
                    stops
            );
        }

        // 3. 최종 응답
        return new RouteResponse(
                allAvailableBooksRoute,
                bestSingleLibrary,
                toBookSummaries(onLoanNearby),
                toBookSummaries(notFoundNearby),
                toBookSummaries(uncoveredBooks)
        );
    }

    private List<RouteResponse.BookSummary> toBookSummaries(Collection<String> isbns) {

        // ISBN 중복 제거
        List<String> uniqueIsbns = isbns.stream().distinct().toList();

        if (uniqueIsbns.isEmpty()) {
            return List.of();
        }

        // ISBN 목록으로 책 정보 한 번에 조회
        List<Map<String, String>> books = routeMapper.getBooksByIsbns(uniqueIsbns);

        // ISBN -> 도서 정보
        Map<String, Map<String, String>> bookByIsbn = new HashMap<>();

        for (Map<String, String> book : books) {
            bookByIsbn.put(
                    String.valueOf(book.get("isbn13")),
                    book
            );
        }

        // 응답 DTO 생성
        return uniqueIsbns.stream()
                .map(isbn -> {
                    Map<String, String> book = bookByIsbn.get(isbn);

                    if (book == null) {
                        return new RouteResponse.BookSummary(
                                isbn, null, null, null, null
                        );
                    }

                    return new RouteResponse.BookSummary(
                            isbn,
                            (String) book.get("title"),
                            (String) book.get("authors"),
                            (String) book.get("publisher"),
                            (String) book.get("publication_year")
                    );
                })
                .toList();
    }
}
