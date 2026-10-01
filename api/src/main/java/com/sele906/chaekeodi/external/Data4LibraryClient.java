package com.sele906.chaekeodi.external;

import com.sele906.chaekeodi.book.domain.Book;
import com.sele906.chaekeodi.book.domain.BookSearchItem;
import com.sele906.chaekeodi.holding.domain.CallNumberCandidate;
import com.sele906.chaekeodi.holding.domain.LoanStatus;
import com.sele906.chaekeodi.library.domain.Library;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.HtmlUtils;
import tools.jackson.databind.JsonNode;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class Data4LibraryClient {

    private final RestClient data4LibraryRestClient;

    @Value("${LIB_API_KEY}")
    private String authKey;

    //도서관 목록 호출
    public LibraryPage fetchLibraries(int pageNo, int pageSize) {

        JsonNode res = get("/libSrch", Map.of(
                "pageNo", pageNo,
                "pageSize", pageSize));
        JsonNode body = res.path("response");
        List<Library> libraries = new ArrayList<>();

        for (JsonNode item : body.path("libs")) {
            libraries.add(toLibrary(item.path("lib")));
        }

        return new LibraryPage(libraries, body.path("numFound").asInt());
    }

    public record LibraryPage(List<Library> libraries, int numFound) {}

    //도서 목록 호출
    public BookPage fetchBooks(String title, int pageNo, int pageSize) {
        JsonNode body = get("/srchBooks", Map.of(
                "title", title, "pageNo", pageNo, "pageSize", pageSize))
                .path("response");

        List<BookSearchItem> books = new ArrayList<>();

        for (JsonNode item : body.path("docs")) {
            JsonNode d = item.path("doc");

            String isbn13 = text(d, "isbn13");
            if (isbn13 == null) continue;   // ISBN 없으면 상세로 못 넘어감
            Integer loan = intValue(d, "loan_count");

            books.add(new BookSearchItem(
                    isbn13,
                    text(d, "bookname"),
                    text(d, "authors"),
                    text(d, "publisher"),
                    text(d, "publication_year"),
                    text(d, "bookImageURL"),
                    loan == null ? 0 : loan
            ));
        }
        return new BookPage(books, body.path("numFound").asInt());
    }

    public record BookPage(List<BookSearchItem> books, int numFound) {}

    //도서 상세정보 호출
    public Optional<Book> fetchBookByIsbn13(String isbn13) {

        JsonNode res = get("/srchDtlList", Map.of(
                "isbn13", isbn13));
        JsonNode detail = res.path("response").path("detail");

        if (!detail.isArray() || detail.isEmpty()) {
            return Optional.empty();   // 없는 ISBN
        }

        JsonNode b = detail.get(0).path("book");
        return Optional.of(toBook(b));
    }

    private Book toBook(JsonNode b) {
        Book book = new Book();
        book.setIsbn13(text(b, "isbn13"));
        book.setTitle(text(b, "bookname"));
        book.setAuthors(text(b, "authors"));
        book.setPublisher(text(b, "publisher"));
        book.setPublicationYear(text(b, "publication_year"));
        book.setClassNo(text(b, "class_no"));
        book.setClassName(text(b, "class_nm"));
        book.setDescription(cleanHtml(text(b, "description")));
        book.setImageUrl(text(b, "bookImageURL"));
        return book;
    }

    //소장 도서관 호출
    public List<String> fetchLibByBook(String isbn, String regionCode) {

        List<String> regions = new ArrayList<>();

        // 현재 지역 추가
        regions.add(regionCode);

        // 인접 지역 추가
        regions.addAll(ADJACENT.getOrDefault(regionCode, List.of()));

        // 도서관 코드 저장
        List<String> libCodes = new ArrayList<>();

        // 지역 하나씩 조회
        for (String region : regions) {
            try {
                JsonNode res = get("/libSrchByBook", Map.of(
                        "isbn", isbn,
                        "region", region,
                        "pageSize", 100
                ));

                JsonNode libs = res.path("response").path("libs");

                // 이 지역에 소장 도서관이 없으면
                // 다음 지역으로 넘어가기
                if (!libs.isArray() || libs.isEmpty()) {
                    continue;
                }

                // 도서관 코드 꺼내기
                for (JsonNode item : libs) {

                    JsonNode lib = item.path("lib");

                    String libCode =
                            lib.path("libCode").asText();

                    if (!libCode.isBlank() && !libCodes.contains(libCode)) {
                        libCodes.add(libCode);
                    }
                }

                //디버그용
                int numFound = res.path("response").path("numFound").asInt();
                log.debug("region={} numFound={} 수집={}", region, numFound, libs.size());

            } catch (Exception e) {
                log.warn("소장 도서관 조회 실패 isbn={} region={}", isbn, region, e);
            }
        }

        return libCodes;
    }

    // 인접 광역 매핑
    private static final Map<String, List<String>> ADJACENT = Map.of(
            "23", List.of("31"),              // 인천 ↔ 경기
            "31", List.of("11", "23", "32"),  // 경기 ↔ 서울·인천·강원
            "11", List.of("31"),              // 서울 ↔ 경기
            "21", List.of("38"),              // 부산 ↔ 경남
            "22", List.of("37"),              // 대구 ↔ 경북
            "24", List.of("36"),              // 광주 ↔ 전남
            "25", List.of("34", "33"),        // 대전 ↔ 충남·충북
            "26", List.of("38"),              // 울산 ↔ 경남
            "29", List.of("34", "33")         // 세종 ↔ 충남·충북
    );

    //청구기호 호출
    public List<CallNumberCandidate> fetchCallNumber(String isbn13, String libCode, String dtlKdc) {

        List<CallNumberCandidate> candidates = new ArrayList<>();

        Map<String, Object> params = new HashMap<>();
        params.put("type", "ALL");
        params.put("libCode", libCode);
        params.put("isbn13", isbn13);
        params.put("pageSize", 100);
        if (dtlKdc != null) {
            params.put("dtl_kdc", dtlKdc);
        }

        JsonNode docs = get("/itemSrch", params).path("response").path("docs");

        //여러 청구기호 후보 리스트로 전환
        for (JsonNode d : docs) {
            JsonNode doc = d.path("doc");
            String classNo = text(doc, "class_no");
            String regDate = text(doc, "reg_date");

            for (JsonNode wrapper : doc.path("callNumbers")) {
                JsonNode cn = wrapper.path("callNumber");

                candidates.add(new CallNumberCandidate(
                        classNo,
                        text(cn, "book_code"),
                        displayOrNull(text(cn, "separate_shelf_name")),
                        displayOrNull(text(cn, "shelf_loc_name")),
                        regDate
                ));
            }
        }
        return candidates;
    }

    // 청구기호 데이터 정제
    // 저장은 원본, 출력만 정제
    private static final Set<String> MEANINGLESS = Set.of("적용안함", "해당없음", "미적용", "없음", "-");

    private String displayOrNull(String value) {
        if (value == null || value.isBlank() || MEANINGLESS.contains(value.trim())) {
            return null;
        }
        return value;
    }

    //도서 소장/대출가능 여부
    public LoanStatus fetchLoanStatus(String isbn13, String libCode) {
        JsonNode result = get("/bookExist", Map.of(
                "libCode", libCode,
                "isbn13", isbn13
        )).path("response").path("result");



        return new LoanStatus(
                "Y".equals(result.path("hasBook").asText()),
                "Y".equals(result.path("loanAvailable").asText())
        );
    }

    // 공통 호출
    private JsonNode get(String path, Map<String, Object> params) {
        return data4LibraryRestClient.get()
                .uri(b -> {
                    b.path(path)
                            .queryParam("authKey", authKey)
                            .queryParam("format", "json");
                    params.forEach(b::queryParam);
                    return b.build();
                })
                .retrieve()
                .body(JsonNode.class);
    }

    // 변환
    private Library toLibrary(JsonNode lib) {
        Library l = new Library();
        l.setLibCode(text(lib, "libCode"));
        l.setName(text(lib, "libName"));
        l.setAddress(cleanHtml(text(lib, "address")));
        l.setTel(text(lib, "tel"));
        l.setFax(text(lib, "fax"));
        l.setHomepage(text(lib, "homepage"));
        l.setLatitude(doubleValue(lib, "latitude"));
        l.setLongitude(doubleValue(lib, "longitude"));
        l.setClosedDays(text(lib, "closed"));
        l.setOperatingTime(text(lib, "operatingTime"));   // ← 수정
        l.setBookCount(intValue(lib, "BookCount"));
        return l;
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.get(field);

        if (value == null || value.isNull()) {
            return null;
        }

        String text = value.asText().trim();

        return text.isEmpty() ? null : text;
    }

    private Double doubleValue(JsonNode node, String field) {
        String value = text(node, field);

        if (value == null) {
            return null;
        }

        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer intValue(JsonNode node, String field) {
        String value = text(node, field);

        if (value == null) {
            return null;
        }

        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String cleanHtml(String value) {

        if (value == null) {
            return null;
        }

        String cleaned = value
                .replaceAll("(?i)<br\\s*/?>", " ")
                .replaceAll("<[^>]*>", "");

        return HtmlUtils.htmlUnescape(cleaned).trim();
    }
}
