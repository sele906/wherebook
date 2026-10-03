package com.sele906.chaekeodi.holding.service;

import com.sele906.chaekeodi.book.domain.Book;
import com.sele906.chaekeodi.book.mapper.BookMapper;
import com.sele906.chaekeodi.external.Data4LibraryClient;
import com.sele906.chaekeodi.holding.domain.*;
import com.sele906.chaekeodi.holding.mapper.HoldingMapper;
import com.sele906.chaekeodi.library.domain.LibrarySearchItem;
import com.sele906.chaekeodi.library.mapper.LibraryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class HoldingService {

    private final TransactionTemplate tx;
    private final LibraryMapper libraryMapper;
    private final BookMapper bookMapper;
    private final HoldingMapper holdingMapper;
    private final Data4LibraryClient client;

    public LibrarySearchByBookResponse searchLibByBook(String isbn13, LibrarySearchByBookRequest req) {

        List<String> regions;

        // 지역 미지정 + 위치 있음 → API 호출용 region 추출
        if (req.getLatitude() != null && req.getLongitude() != null) {

            regions = holdingMapper.findNearestRegionWithLocationAndRadius(
                    req.getLatitude(),
                    req.getLongitude(),
                    req.getRadius()
            );

        } else {
            regions = List.of(req.getRegion());
        }

        // 소장 도서관 후보군 확보
        List<String> libCodes = client.fetchLibByBook(isbn13, regions);

        if (libCodes.isEmpty()) {
            return new LibrarySearchByBookResponse(List.of(), 0);
        }

        req.setLibCodes("{" + String.join(",", libCodes) + "}");

        //위치로 필터
        List<LibrarySearchItem> libraries = libraryMapper.searchLibByDistance(req);

        return new LibrarySearchByBookResponse(libraries,libraries.size());
    }

    public CallNumberResponse getCallNumber(String isbn13, String libCode) {

        // 1. 캐시 조회
        BookCallNumber cached = holdingMapper.findCallNumber(libCode, isbn13);

        //있으면 바로 출력
        if (cached != null && isFresh(cached)) {

            //유효성 검사
            List<BookCallNumberItem> itemList = "OK".equals(cached.getStatus())
                    ? holdingMapper.findCallNumberItems(cached.getLibCode(), cached.getIsbn13())
                    : List.of();

            return toResponse(cached.getStatus(), itemList);
        }

        // 2. dtl_kdc 반환
        Book book = bookMapper.getBookByIsbn13(isbn13);
        String dtlKdc = (book == null) ? null : toDtlKdc(book.getClassNo());

        // 3. 외부 호출
        List<BookCallNumberItem> items;
        String status;

        try {
            List<CallNumberCandidate> candidates = client.fetchCallNumber(isbn13, libCode, dtlKdc);

            if (candidates.isEmpty() && dtlKdc != null) {
                candidates = client.fetchCallNumber(isbn13, libCode, null);
            }

            // 청구기호 그룹화하고 정렬
            items = groupAndSort(candidates, libCode, isbn13);
            status = items.isEmpty() ? "NOT_FOUND" : "OK";

        } catch (Exception e) {
            //실패  → status=ERROR 저장
            log.warn("청구기호 조회 실패 isbn={} libCode={}", isbn13, libCode, e);

            // 오래됐어도 기존 OK 캐시가 있으면 ERROR로 덮어쓰지 말고 그걸 반환
            if (cached != null && "OK".equals(cached.getStatus())) {

                List<BookCallNumberItem> itemList = holdingMapper.findCallNumberItems(cached.getLibCode(), cached.getIsbn13());

                return toResponse("OK", itemList);
            }

            items = List.of();
            status = "ERROR";
        }

        // 4. 저장 후 반환
        BookCallNumber header = new BookCallNumber();
        header.setLibCode(libCode);
        header.setIsbn13(isbn13);
        header.setStatus(status);

        //트랜잭션 없으면 3가지 쿼리를 한꺼번에 실행했을 때 중간에 에러날경우 되돌리기가 어려움
        List<BookCallNumberItem> itemsToSave = items;

        tx.executeWithoutResult(s -> {
            holdingMapper.upsertCallNumber(header); //청구기호 헤더 저장
            holdingMapper.deleteCallNumberItems(libCode, isbn13); //기존 청구기호 아이템 삭제
            if (!itemsToSave.isEmpty()) {
                holdingMapper.insertCallNumberItems(itemsToSave); //새로운 청구기호 아이템 추가
            }
        });

        return toResponse(status, items);

    }

    //class_no에서 앞 2자리 반환
    private String toDtlKdc(String classNo) {
        if (classNo == null) return null;
        String digits = classNo.replaceAll("[^0-9]", "");
        return digits.length() >= 2 ? digits.substring(0, 2) : null;
    }

    //TTL
    private boolean isFresh(BookCallNumber c) {
        long days = (System.currentTimeMillis() - c.getFetchedAt().getTime())
                / (1000L * 60 * 60 * 24);
        return switch (c.getStatus()) {
            case "OK" -> true;
            case "NOT_FOUND" -> days < 30;
            default -> days < 3;
        };
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

    //도서 소장/대출가능 여부
    public LoanStatusResponse getLoanStatus(String isbn13, String libCode) {
        try {
            var status = client.fetchLoanStatus(isbn13, libCode);
            return new LoanStatusResponse(status.isBookExists(), status.isLoanAvailable(), "OK");
        } catch (Exception e) {
            log.warn("대출 여부 조회 실패 isbn={} libCode={}", isbn13, libCode, e);
            return new LoanStatusResponse(false, false, "ERROR");
        }
    }
}
