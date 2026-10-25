package com.sele906.chaekeodi.route.service;

import com.sele906.chaekeodi.external.data4library.Data4LibraryClient;
import com.sele906.chaekeodi.holding.domain.LoanStatus;
import com.sele906.chaekeodi.route.domain.*;
import com.sele906.chaekeodi.route.mapper.RouteMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteMapper routeMapper;
    private final Data4LibraryClient client;

    public RouteResponse getCalcRoute(RouteRequest request) {

        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new IllegalArgumentException("경로 계산에는 위치 정보가 필요합니다.");
        }

        List<String> borrowList = request.getIsbns();

        // 1. 사용자 반경 내 도서관 조회
        List<CandidateLibrary> libraries = routeMapper.searchLibraries(request);

        if (libraries.isEmpty()) {
            return new RouteResponse(null, null, List.of(), toBookSummaries(borrowList));
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

        // 5. 빌릴 책들을 하나씩 조회
        for (String isbn : borrowList) {

            boolean availableNearby = false; // 한 곳이라도 대출 가능
            boolean heldNearby = false;      // 한 곳이라도 소장

            // 소장 도서관 코드 조회
            List<String> holdingLibraryCodes = client.fetchLibByBookDtlRegion(isbn, regions);

            for (String libCode : holdingLibraryCodes) {

                if (!candidateLibraryCodes.contains(libCode)) continue;

                //대출 가능 여부 확인
                LoanStatus s = client.fetchLoanStatus(isbn, libCode);
                if (!s.isBookExists()) continue;
                heldNearby = true;

                if (s.isLoanAvailable()) {

                    // 해당 도서관에 이미 저장된 ISBN 목록 가져오기
                    //도서관 코드가 없으면 새로운 Set을 생성, 있으면 기존 Set에 ISBN을 추가
                    Set<String> heldIsbns = availableByLibrary.get(libCode);

                    if (heldIsbns == null) {
                        heldIsbns = new HashSet<>();
                        availableByLibrary.put(libCode, heldIsbns);
                    }

                    heldIsbns.add(isbn);

                    // 반경 내에서 책을 찾았다고 표시
                    availableNearby = true;
                }
            }

            if (!availableNearby) {
                if (heldNearby) {
                    isbnsOnLoanNearby.add(isbn);    // 도서 소장하지만 전부 대출 중
                } else {
                    isbnsnotFoundNearbyNearby.add(isbn);  // 도서 소장 도서관 없음
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
                isbnsnotFoundNearbyNearby
        );
    }

    private RouteResponse toResponse(
            RoutePlan plan,
            Map<String, CandidateLibrary> libByCode,
            List<String> onLoanNearby,
            List<String> notFoundNearby
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
                toBookSummaries(notFoundNearby)
        );
    }

    private List<RouteResponse.BookSummary> toBookSummaries(Collection<String> isbns) {
        return isbns.stream()
                .distinct()
                .map(isbn -> new RouteResponse.BookSummary(
                        isbn,
                        routeMapper.getTitleByIsbn(isbn)
                ))
                .toList();
    }
}
