package com.sele906.chaekeodi.external.data4library;

import com.sele906.chaekeodi.book.domain.Book;
import com.sele906.chaekeodi.book.domain.BookSearchItem;
import com.sele906.chaekeodi.common.exception.ExternalApiException;
import com.sele906.chaekeodi.holding.domain.CallNumberCandidate;
import com.sele906.chaekeodi.holding.domain.LoanStatus;
import com.sele906.chaekeodi.library.domain.Library;
import com.sele906.chaekeodi.route.domain.Region;
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

    @Value("${library.api.auth-key}")
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

    //소장 도서관 지역별 호출
    public List<String> fetchLibByBook(String isbn, List<String> regions) {

        // 중복 제거도 같이
        Set<String> libCodes = new LinkedHashSet<>();

        int pageSize = 100;

        // 느림!! 보완 필요!!
        //자체 쿼리로 해결할수 있을거 같은데??
        // 지역 하나씩 조회
        for (String region : regions) {

            int pageNo = 1;

            try {
                while (true) {

                    JsonNode res = get("/libSrchByBook", Map.of(
                            "isbn", isbn,
                            "region", region,
                            "pageNo", pageNo,
                            "pageSize", pageSize
                    ));

                    JsonNode response = res.path("response");
                    JsonNode libs = response.path("libs");

                    int numFound = response.path("numFound").asInt();

                    // 더 이상 결과 없음
                    if (!libs.isArray() || libs.isEmpty()) {
                        break;
                    }

                    for (JsonNode item : libs) {

                        String libCode = item.path("lib")
                                .path("libCode")
                                .asText();

                        if (!libCode.isBlank()) {
                            libCodes.add(libCode);
                        }
                    }

                    log.debug(
                            "region={} page={} numFound={} 현재페이지={} 누적={}",
                            region,
                            pageNo,
                            numFound,
                            libs.size(),
                            libCodes.size()
                    );

                    // 마지막 페이지
                    if (pageNo * pageSize >= numFound) {
                        break;
                    }

                    pageNo++;
                }

            } catch (Exception e) {
                log.warn(
                        "소장 도서관 조회 실패 isbn={} region={}",
                        isbn,
                        region,
                        e
                );
            }
        }

        return new ArrayList<>(libCodes);
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

        try {
            JsonNode res = get("/bookExist", Map.of(
                    "libCode", libCode,
                    "isbn13", isbn13
            ));

            // 응답 데이터 검증
            JsonNode result = res == null ? null : res.path("response").path("result");

            if (result == null || !result.isObject()) {
                throw new ExternalApiException("대출 상태 조회 응답 형식이 올바르지 않습니다.");
            }

            String hasBook = result.path("hasBook").asText();
            String loanAvailable = result.path("loanAvailable").asText();

            // Y 또는 N 이외의 값은 오류 처리
            if (!isValidYn(hasBook) || !isValidYn(loanAvailable)) {
                throw new ExternalApiException("대출 상태 조회 결과가 올바르지 않습니다.");
            }

            return new LoanStatus(
                    "Y".equals(hasBook),
                    "Y".equals(loanAvailable)
            );

        } catch (ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ExternalApiException("정보나루 대출 상태 조회 실패: " + isbn13, e);
        }
    }

    // Y/N 값 검증
    private boolean isValidYn(String value) {
        return "Y".equals(value) || "N".equals(value);
    }

    //소장 도서관 세부 지역별 호출
    public List<String> fetchLibByBookDtlRegion(String isbn, Set<Region> dtlRegions) {

        // 중복 제거도 같이
        Set<String> libCodes = new LinkedHashSet<>();

        int pageSize = 100;

        // 세부지역 하나씩 조회
        for (Region d : dtlRegions) {

            int pageNo = 1;

            try {
                while (true) {

                    JsonNode res = get("/libSrchByBook", Map.of(
                            "isbn", isbn,
                            "region", d.getRegion(),
                            "dtl_region", d.getDtlRegion(),
                            "pageNo", pageNo,
                            "pageSize", pageSize
                    ));

                    JsonNode response = res == null ? null : res.path("response");

                    // 응답 구조 자체가 잘못된 경우
                    if (response == null || !response.isObject()) {
                        throw new ExternalApiException("정보나루 응답 형식이 올바르지 않습니다.");
                    }

                    JsonNode numFoundNode = response.path("numFound");

                    // numFound가 없거나 유효한 숫자가 아닌 경우
                    if (!numFoundNode.asText().matches("\\d+")) {
                        throw new ExternalApiException("정보나루 응답에 numFound가 없습니다.");
                    }

                    int numFound = numFoundNode.asInt();

                    // 정상적으로 조회했지만 소장 도서관이 없는 경우
                    if (numFound == 0) {
                        break;
                    }

                    JsonNode libs = response.path("libs");

                    // 결과가 있다고 했는데 목록이 없는 경우
                    if (!libs.isArray() || libs.isEmpty()) {
                        throw new ExternalApiException("소장 도서관 목록 응답이 올바르지 않습니다.");
                    }

                    // 더 이상 결과 없음
                    if (!libs.isArray() || libs.isEmpty()) {
                        break;
                    }

                    for (JsonNode item : libs) {

                        String libCode = item.path("lib")
                                .path("libCode")
                                .asText();

                        if (!libCode.isBlank()) {
                            libCodes.add(libCode);
                        }
                    }

                    // 마지막 페이지
                    if (pageNo * pageSize >= numFound) {
                        break;
                    }

                    pageNo++;
                }

            } catch (Exception e) {
                log.error(
                        "소장 도서관 조회 실패 isbn={} region={}",
                        isbn,
                        d.getDtlRegion(),
                        e
                );

                throw new ExternalApiException(
                        "정보나루 소장 도서관 조회에 실패했습니다.",
                        e
                );
            }
        }

        return new ArrayList<>(libCodes);
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
