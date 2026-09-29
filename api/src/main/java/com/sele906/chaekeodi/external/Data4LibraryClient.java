package com.sele906.chaekeodi.external;

import com.sele906.chaekeodi.book.domain.Book;
import com.sele906.chaekeodi.book.domain.BookSearchItem;
import com.sele906.chaekeodi.library.domain.Library;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.HtmlUtils;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class Data4LibraryClient {

    private final RestClient data4LibraryRestClient;

    @Value("${LIB_API_KEY}")
    private String authKey;

    //도서관 목록
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

    //도서 목록
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

    //도서 상세정보
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
