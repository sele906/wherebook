package com.sele906.chaekeodi.holding.service;

import com.sele906.chaekeodi.book.domain.Book;
import com.sele906.chaekeodi.book.mapper.BookMapper;
import com.sele906.chaekeodi.cache.policy.CachePolicy;
import com.sele906.chaekeodi.cache.support.SingleFlight;
import com.sele906.chaekeodi.common.exception.BadRequestException;
import com.sele906.chaekeodi.common.exception.ExternalApiException;
import com.sele906.chaekeodi.external.data4library.Data4LibraryClient;
import com.sele906.chaekeodi.holding.domain.*;
import com.sele906.chaekeodi.holding.mapper.HoldingMapper;
import com.sele906.chaekeodi.library.domain.LibrarySearchItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import jakarta.annotation.PreDestroy;
import java.util.concurrent.*;
import java.util.stream.Collectors;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class HoldingService {

    private final TransactionTemplate tx;
    private final BookMapper bookMapper;
    private final HoldingMapper holdingMapper;
    private final Data4LibraryClient client;

    // 진행 중인 대출 상태 조회 (같은 키는 하나만 실행)
    private final SingleFlight singleFlight;

    // 외부 API 동시 호출 최대 20개
    private final ExecutorService pool = Executors.newFixedThreadPool(20);

    @PreDestroy
    public void shutdownPool() {
        pool.shutdown();
    }

    public LibrarySearchByBookResponse searchLibByBook(String isbn13, LibrarySearchByBookRequest req) {

        // 1. 필요한 지역 목록 (위치 or 요청값)
        List<Region> regions = resolveRegions(req);

        if (regions.isEmpty()) {
            return new LibrarySearchByBookResponse(List.of(), 0);
        }

        // 2. 지역 캐시
        refreshStaleRegions(isbn13, regions);
        List<String> libCodes = holdingMapper.getHoldingLibCodes(isbn13, regions);

        if (libCodes.isEmpty()) {
            return new LibrarySearchByBookResponse(List.of(), 0);
        }

        req.setLibCodes(libCodes);

        // 3. 위치로 필터
        List<LibrarySearchItem> libraries = holdingMapper.searchLibByDistance(req);

        return new LibrarySearchByBookResponse(libraries,libraries.size());
    }

    //필요한 지역 목록 가져오기
    private List<Region> resolveRegions(LibrarySearchByBookRequest req) {

        if (req.getLatitude() != null && req.getLongitude() != null) {
            return holdingMapper.findRegionsNear(req.getLatitude(), req.getLongitude(), req.getRadius());
        }

        if (req.getRegionCode() != null && req.getDtlRegionCode() != null) {
            return List.of(new Region(req.getRegionCode(), req.getDtlRegionCode()));
        }

        throw new BadRequestException("위치 또는 지역 코드가 필요합니다.");
    }

    public CallNumberResponse getCallNumber(String isbn13, String libCode) {

        // 1. 캐시 조회
        BookCallNumber cached = holdingMapper.findCallNumber(libCode, isbn13);

        //있으면 바로 출력
        if (cached != null && CachePolicy.isFresh(cached)) {

            //유효성 검사
            List<BookCallNumberItem> itemList = "OK".equals(cached.getStatus())
                    ? holdingMapper.findCallNumberItems(cached.getLibCode(), cached.getIsbn13())
                    : List.of();

            return toResponse(cached.getStatus(), itemList);
        }

        // 2. dtl_kdc 반환
        Book book = bookMapper.getBookByIsbn13(isbn13);
        String dtlKdc = (book == null) ? null : toDtlKdc(book.getClassNo());

        // 3. 외부 호출 + 저장 (같은 책·도서관은 동시에 한 번만)
        try {
            List<BookCallNumberItem> items = singleFlight.run("callno:" + isbn13 + ":" + libCode,
                    () -> fetchAndSaveCallNumber(isbn13, libCode, dtlKdc));

            return toResponse(items.isEmpty() ? "NOT_FOUND" : "OK", items);

        } catch (Exception e) {

            //실패  → status=ERROR 저장
            log.warn("청구기호 조회 실패 isbn={} libCode={}", isbn13, libCode, e);

            // 오래됐어도 기존 OK 캐시가 있으면 ERROR로 덮어쓰지 말고 그걸 반환
            if (cached != null && "OK".equals(cached.getStatus())) {

                List<BookCallNumberItem> itemList = holdingMapper.findCallNumberItems(cached.getLibCode(), cached.getIsbn13());

                return toResponse("OK", itemList);
            }

            // 실패는 저장하지 않고 이번 응답만 ERROR로
            return toResponse("ERROR", List.of());
        }
    }

    // 기존 3번 try 안쪽 + 4번 저장 블록을 그대로 옮긴 것
    private List<BookCallNumberItem> fetchAndSaveCallNumber(String isbn13, String libCode, String dtlKdc) {

        List<CallNumberCandidate> candidates = client.fetchCallNumber(isbn13, libCode, dtlKdc);

        // 분류번호로 좁혀서 못 찾았으면 조건 없이 재조회
        if (candidates.isEmpty() && dtlKdc != null) {
            candidates = client.fetchCallNumber(isbn13, libCode, null);
        }

        //청구기호 정렬 및 그룹화
        List<BookCallNumberItem> items = groupAndSort(candidates, libCode, isbn13);

        BookCallNumber header = new BookCallNumber();
        header.setLibCode(libCode);
        header.setIsbn13(isbn13);
        header.setStatus(items.isEmpty() ? "NOT_FOUND" : "OK");

        tx.executeWithoutResult(s -> {
            holdingMapper.upsertCallNumber(header);
            holdingMapper.deleteCallNumberItems(libCode, isbn13);
            if (!items.isEmpty()) {
                holdingMapper.insertCallNumberItems(items);
            }
        });

        return items;
    }

    //class_no에서 앞 2자리 반환
    private String toDtlKdc(String classNo) {
        if (classNo == null) return null;
        String digits = classNo.replaceAll("[^0-9]", "");
        return digits.length() >= 2 ? digits.substring(0, 2) : null;
    }

    // 청구기호 응답 객체 생성
    private CallNumberResponse toResponse(String status, List<BookCallNumberItem> items) {
        List<CallNumberItem> list = new ArrayList<>();

        //청구기호 형식
        for (var item : items) {

            List<String> parts = new ArrayList<>();

            //분류번호 유효성검사
            // "null-정67ㅊ" 방지
            if (item.getClassNo() != null && !item.getClassNo().isBlank()) {
                parts.add(item.getClassNo());
            }

            //도서기호 유효성검사
            //"813.7-null" 방지
            if (item.getBookCode() != null && !item.getBookCode().isBlank()) {
                parts.add(item.getBookCode());
            }

            String callNumber = String.join("-", parts);

            //배가위치 유효성검사
            if (item.getSeparateShelfName() != null && !item.getSeparateShelfName().isBlank()) {
                callNumber = item.getSeparateShelfName() + " " + callNumber;
            }

            CallNumberItem converted = new CallNumberItem(callNumber, item.getShelfLocName(), item.getCopyCount());
            list.add(converted);
        }

        return new CallNumberResponse(status, list);
    }

    //청구기호 그룹화 및 정렬
    private List<BookCallNumberItem> groupAndSort(List<CallNumberCandidate> candidates, String libCode, String isbn13) {

        //유효성 검사
        if (candidates == null || candidates.isEmpty()) return List.of();

        // 같은 위치끼리 묶기
        Map<String, List<CallNumberCandidate>> groups = new LinkedHashMap<>();

        for (CallNumberCandidate c : candidates) {

            String key = c.groupKey();

            if (!groups.containsKey(key)) {
                groups.put(key, new ArrayList<>());
            }

            groups.get(key).add(c);
        }

        // 그룹 → 아이템
        List<BookCallNumberItem> items = new ArrayList<>();

        for (List<CallNumberCandidate> group : groups.values()) {

            CallNumberCandidate first = group.get(0);

            BookCallNumberItem item = new BookCallNumberItem(
                    libCode,
                    isbn13,
                    0,
                    first.getClassNo(),
                    first.getBookCode(),
                    first.getSeparateShelfName(),
                    first.getShelfLocName(),
                    group.size(),
                    latestRegDate(group)
            );

            items.add(item);
        }

        // 복본 많은 순 → 최신 등록순
        items.sort((a, b) -> {
            if (a.getCopyCount() != b.getCopyCount()) {
                return Integer.compare(b.getCopyCount(), a.getCopyCount());
            }
            return b.getLatestRegDate().compareTo(a.getLatestRegDate());
        });

        for (int i = 0; i < items.size(); i++) {
            items.get(i).setSeq(i);
        }
        return items;
    }

    //그룹에서 최신 날짜 찾기
    private String latestRegDate(List<CallNumberCandidate> group) {

        String latestDate = "";

        for (CallNumberCandidate candidate : group) {

            String regDate = candidate.getRegDate();

            // 등록일이 없는 데이터는 무시
            if (regDate == null) {
                continue;
            }

            // 지금까지 본 날짜보다 최신이면 교체
            if (regDate.compareTo(latestDate) > 0) {
                latestDate = regDate;
            }
        }

        return latestDate;
    }

    // ISBN별 소장 도서관 목록 조회
    public Map<String, List<String>> getHoldingLibCodes(List<String> isbns, List<Region> regions) {

        if (isbns == null || isbns.isEmpty() || regions == null || regions.isEmpty()) {
            return Map.of();
        }

        // 캐시가 없는 지역만 API 호출 후 DB 갱신
        for (String isbn : new LinkedHashSet<>(isbns)) {
            refreshStaleRegions(isbn, regions);
        }

        // ISBN 여러 개를 DB에서 한 번에 조회
        return holdingMapper
                .getHoldingLibCodesBulk(isbns, regions)
                .stream()
                .collect(Collectors.groupingBy(
                        HoldingLibraryItem::getIsbn13,
                        Collectors.mapping(
                                HoldingLibraryItem::getLibCode,
                                Collectors.toList()
                        )
                ));
    }

    // ISBN + 도서관별 대출 상태 개별 조회
    public LoanStatusResponse getLoanStatus(String isbn13, String libCode) {
        BookLib key = new BookLib(isbn13, libCode);
        return Optional.ofNullable(getLoanStatuses(List.of(key)).get(key))
                .map(s -> new LoanStatusResponse(s.isBookExists(), s.isLoanAvailable(), "OK"))
                .orElse(new LoanStatusResponse(false, false, "ERROR"));
    }

    // ISBN + 도서관별 대출 상태 묶음 조회
    public Map<BookLib, LoanStatus> getLoanStatuses(Collection<BookLib> keys) {

        if (keys == null || keys.isEmpty()) {
            return Map.of();
        }

        // 유효한 캐시를 DB에서 한 번에 조회
        Map<BookLib, LoanStatus> result = new HashMap<>();

        List<LoanStatus> cached = holdingMapper.getFreshStatuses(keys, CachePolicy.LOAN_STATUS.freshSince());

        for (LoanStatus s : cached) {
            BookLib key = new BookLib(s.getIsbn13(), s.getLibCode());
            result.put(key, s);
        }

        // 캐시가 없는 항목만 API 호출
        List<BookLib> missKeys = keys.stream().filter(k -> !result.containsKey(k)).toList();

        //대출상태 개별 호출 > 스레드풀 사용X
        if (missKeys.size() == 1) {
            BookLib key = missKeys.get(0);
            try {
                result.put(key, singleFlight.run("loan:" + key.getIsbn13() + ":" + key.getLibCode(), () -> {
                    LoanStatus status = fetchValidated(key);
                    holdingMapper.upsertStatus(status);
                    return status;
                }));
            } catch (Exception e) {
                log.warn("대출여부 조회 실패, 건너뜀 {}", key, e);
            }
            return result;
        }

        //대출상태 여러개 호출 > 스레드풀 사용O
        Map<BookLib, CompletableFuture<LoanStatus>> misses = new LinkedHashMap<>();

        for (BookLib key : keys) {
            if (result.containsKey(key)) { continue; }

            CompletableFuture<LoanStatus> future =
                    CompletableFuture.supplyAsync(
                            () -> singleFlight.run(
                                    "loan:" + key.getIsbn13() + ":" + key.getLibCode(),
                                    () -> {
                                        LoanStatus status = fetchValidated(key);
                                        holdingMapper.upsertStatus(status);
                                        return status;
                                    }
                            ) , pool
                    );

            misses.put(key, future);
        }

        // 저장 끝난 결과 수집
        for (var entry : misses.entrySet()) {
            try {
                BookLib key = entry.getKey();
                LoanStatus status = await(entry.getValue());
                result.put(key, status);
            } catch (Exception e) {
                log.warn("대출여부 조회 실패, 건너뜀 {}", entry.getKey(), e);
            }
        }

        return result;
    }

    private LoanStatus fetchValidated(BookLib key) {
        LoanStatus status = client.fetchLoanStatus(key.getIsbn13(), key.getLibCode());
        if (status == null) {
            throw new ExternalApiException("대출 상태 응답 없음: " + key);
        }
        if (!Objects.equals(status.getIsbn13(), key.getIsbn13())
                || !Objects.equals(status.getLibCode(), key.getLibCode())) {
            throw new ExternalApiException("대출 상태 응답의 ISBN/도서관 코드 불일치: " + key);
        }
        return status;
    }

    // 지역별 소장 도서관 캐시 갱신
    public void refreshStaleRegions(String isbn13, List<Region> regions) {

        if (regions == null || regions.isEmpty()) { return; }

        // 최근 30일 내 확인한 지역
        Set<Region> fresh = holdingMapper.findFreshRegions(isbn13, regions, CachePolicy.HOLDING.freshSince());

        List<CompletableFuture<Void>> futures =  new ArrayList<>();

        // 캐시가 없거나 만료된 지역만 조회
        for (Region region : new LinkedHashSet<>(regions)) {

            if (fresh.contains(region)) { continue; }

            CompletableFuture<Void> future = CompletableFuture.runAsync(() ->

            singleFlight.run("holding:" + isbn13 + ":" + region.getRegionCode() + ":" + region.getDtlRegionCode(),
                    () -> {

                        List<HoldingLibraryItem> items = client.fetchLibByBookInRegion(isbn13,region);

                        if (items == null) {
                            throw new ExternalApiException("소장 도서관 응답 없음: " + isbn13 + ", " + region);
                        }

                        // 한 지역의 캐시 교체를 트랜잭션으로 처리
                        tx.executeWithoutResult(status -> {
                            holdingMapper.deleteHoldings(isbn13, region);

                            if (!items.isEmpty()) {
                                holdingMapper.insertHoldings(items);
                            }

                            // 소장 도서관이 0곳이어도 조회 완료 기록
                            holdingMapper.upsertRegionFetch(isbn13, region);

                        });

                        return null;

                    }
            ), pool).exceptionally(e -> {
                log.warn("소장 조회 실패, 건너뜀 isbn={} region={}", isbn13, region, e);
                return null;
            });

            futures.add(future);
        }

        // 모든 지역의 갱신 작업이 끝날 때까지 대기
        await(CompletableFuture.allOf(
                futures.toArray(new CompletableFuture[0])
        ));
    }

    // 4. 비동기 작업 결과 가져오기
    private <T> T await(CompletableFuture<T> future) {
        try {
            return future.orTimeout(10, TimeUnit.SECONDS).join();
        } catch (CompletionException e) {
            if (e.getCause() instanceof ExternalApiException apiException) {
                throw apiException;
            }
            throw e;
        }
    }
}
