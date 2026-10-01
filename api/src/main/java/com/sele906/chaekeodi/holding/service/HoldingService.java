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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class HoldingService {

    private final LibraryMapper libraryMapper;
    private final BookMapper bookMapper;
    private final HoldingMapper holdingMapper;
    private final Data4LibraryClient client;

    public LibrarySearchByBookResponse searchLibByBook(String isbn13, LibrarySearchByBookRequest req) {

        //인접 지역 소장 도서관 코드 모두 불러오기 (매우 많음)
        List<String> libCodes = client.fetchLibByBook(isbn13, req.getRegion());

        if (libCodes.isEmpty()) {
            return new LibrarySearchByBookResponse(List.of(), 0);
        }

        req.setLibCodes("{" + String.join(",", libCodes) + "}");

        //테스트용
        //사용자 위치 제공되었을 경우 제공되지 않았을 경우 생각해야함
        req.setLatitude(37.4849972);
        req.setLongitude(126.7045879);
        req.setRadius(10000);

        //위치로 필터
        List<LibrarySearchItem> libraries = libraryMapper.searchLibByDistance(req);

        return new LibrarySearchByBookResponse(libraries, libraries.size());
    }

    public CallNumberResponse getCallNumber(String isbn13, String libCode) {

        // 1. 캐시 조회
        BookCallNumber cached = holdingMapper.findCallNumber(libCode, isbn13);

        //있으면 바로 출력
        if (cached != null && isFresh(cached)) {
            return toResponse(cached);
        }

        // 2. dtl_kdc 반환
        Book book = bookMapper.getBookByIsbn13(isbn13);
        String dtlKdc = (book == null) ? null : toDtlKdc(book.getClassNo());

        // 3. 외부 호출
        BookCallNumber result = new BookCallNumber();
        result.setLibCode(libCode);
        result.setIsbn13(isbn13);

        try {
            List<CallNumberCandidate> candidates = client.fetchCallNumber(isbn13, libCode, dtlKdc);

            if (candidates.isEmpty() && dtlKdc != null) {
                candidates = client.fetchCallNumber(isbn13, libCode, null);
            }

            // 후보 중 대표 선택
            CallNumberCandidate best = pickBest(candidates);

            if (best == null) {
                //0건   → status=NOT_FOUND 저장
                result.setStatus("NOT_FOUND");
            } else {
                //성공  → 후보 중 대표 선택, status=OK 저장
                result.setClassNo(best.getClassNo());
                result.setBookCode(best.getBookCode());
                result.setSeparateShelfName(best.getSeparateShelfName());
                result.setShelfLocName(best.getShelfLocName());
                result.setStatus("OK"); //status=OK 저장
            }
        } catch (Exception e) {
            //실패  → status=ERROR 저장
            log.warn("청구기호 조회 실패 isbn={} libCode={}", isbn13, libCode, e);
            result.setStatus("ERROR");
        }

        // 4. 저장 후 반환
        holdingMapper.upsertCallNumber(result);
        return toResponse(result);
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

    //청구기호 반환 형식
    private CallNumberResponse toResponse(BookCallNumber c) {

        // 상태가 OK가 아니면 청구기호와 서가 위치는 null
        if (!"OK".equals(c.getStatus())) {
            return new CallNumberResponse(null, null, c.getStatus());
        }

        // 별치명이 있으면 청구기호 앞에 붙인다
        String prefix = "";

        if (c.getSeparateShelfName() != null) {
            prefix = c.getSeparateShelfName() + " ";
        }

        // 최종 청구기호 만들기
        String callNumber = prefix + c.getClassNo() + "-" + c.getBookCode();

        // 응답 객체 생성
        return new CallNumberResponse(
                callNumber,
                c.getShelfLocName(),
                c.getStatus()
        );
    }

    //대표 청구기호 정하기
    private CallNumberCandidate pickBest(List<CallNumberCandidate> candidates) {

        if (candidates == null || candidates.isEmpty()) {
            return null;
        }

        Map<String, List<CallNumberCandidate>> groups = new HashMap<>();

        //같은 청구기호 후보끼리 묶기
        for (CallNumberCandidate c : candidates) {

            String key = c.groupKey();

            // 아직 이 key의 그룹이 없으면 새 리스트를 만든다
            if (!groups.containsKey(key)) {
                groups.put(key, new ArrayList<>());
            }

            // 해당 그룹에 후보를 넣는다
            groups.get(key).add(c);
        }

        List<CallNumberCandidate> best = null;

        //제일 많이 나온 그룹 선택
        for (List<CallNumberCandidate> group : groups.values()) {

            if (best == null) {
                best = group;
                continue;
            }

            if (group.size() > best.size()) {
                best = group;
                continue;
            }

            //동률이면 등록일이 최신인 그룹 선택
            if (group.size() == best.size()) {

                String groupLatestDate = latestRegDate(group);
                String bestLatestDate = latestRegDate(best);

                if (groupLatestDate.compareTo(bestLatestDate) > 0) {
                    best = group;
                }
            }
        }

        //그 그룹의 첫번째 후보 반환
        return best.get(0);
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
