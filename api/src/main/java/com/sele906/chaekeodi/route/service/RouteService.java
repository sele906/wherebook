package com.sele906.chaekeodi.route.service;

import com.sele906.chaekeodi.common.exception.ExternalApiException;
import com.sele906.chaekeodi.external.data4library.Data4LibraryClient;
import com.sele906.chaekeodi.holding.domain.LoanStatus;
import com.sele906.chaekeodi.route.domain.*;
import com.sele906.chaekeodi.route.mapper.RouteMapper;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteMapper routeMapper;
    private final Data4LibraryClient client;

    // 동시에 최대 4개의 API 작업 실행
    private final ExecutorService pool = Executors.newFixedThreadPool(4);

    // ISBN과 도서관 코드를 하나의 키로 묶기
    private record BookLib(String isbn, String libCode) {}

    @PreDestroy
    public void shutdownPool() {
        pool.shutdown();
    }

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

        // 5. 빌릴 책들 조회
        // 5-1. ISBN별 소장 도서관 조회 (비동기)
        Map<String, CompletableFuture<List<String>>> holdingsF = new LinkedHashMap<>();

        // 중복 ISBN 제거
        List<String> uniqueIsbns = borrowList.stream()
                .distinct()
                .toList();

        for (String isbn : uniqueIsbns) {

            CompletableFuture<List<String>> future = CompletableFuture.supplyAsync(() -> client.fetchLibByBookDtlRegion(isbn, regions), pool);

            holdingsF.put(isbn, future);
        }

        // 5-2. ISBN + 도서관별 대출 상태 조회 (비동기)
        Map<BookLib, CompletableFuture<LoanStatus>> loanF = new LinkedHashMap<>();

        for (String isbn : uniqueIsbns) {

            // 소장 도서관 조회 결과 가져오기
            List<String> holdingLibraryCodes = holdingsF.get(isbn).join();

            List<String> matchedCodes = holdingLibraryCodes.stream()
                    .filter(candidateLibraryCodes::contains)
                    .distinct()
                    .toList();

            // 중복 도서관 코드 제거
            for (String libCode : new LinkedHashSet<>(holdingLibraryCodes)) {

                // 사용자 검색 반경 내 도서관만 확인
                if (!candidateLibraryCodes.contains(libCode)) continue;

                BookLib key = new BookLib(isbn, libCode);

                CompletableFuture<LoanStatus> future = CompletableFuture.supplyAsync(() -> client.fetchLoanStatus(isbn, libCode), pool);

                loanF.put(key, future);
            }
        }

        // 5-3. API 결과 수집 및 ISBN 분류
        for (String isbn : uniqueIsbns) {

            boolean availableNearby = false;
            boolean heldNearby = false;

            // 이미 요청한 소장 도서관 조회 결과
            List<String> holdingLibraryCodes = await(holdingsF.get(isbn));

            for (String libCode : holdingLibraryCodes) {

                if (!candidateLibraryCodes.contains(libCode)) continue;

                // 이미 요청한 대출 상태 조회 결과
                BookLib key = new BookLib(isbn, libCode);
                LoanStatus s = await(loanF.get(key));

                if (s == null || !s.isBookExists()) continue;

                heldNearby = true;

                if (s.isLoanAvailable()) {

                    // 도서관별 대출 가능한 ISBN 저장
                    Set<String> heldIsbns = availableByLibrary.get(libCode);

                    if (heldIsbns == null) {
                        heldIsbns = new HashSet<>();
                        availableByLibrary.put(libCode, heldIsbns);
                    }

                    heldIsbns.add(isbn);

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

    private <T> T await(CompletableFuture<T> future) {
        try {
            return future.join();

        } catch (CompletionException e) {

            if (e.getCause() instanceof ExternalApiException apiException) {
                throw apiException;
            }

            throw e;
        }
    }
}
