package com.sele906.api.library.service;

import com.sele906.api.common.exception.ResponseNotFoundException;
import com.sele906.api.library.domain.Library;
import com.sele906.api.library.domain.LibrarySearchRequest;
import com.sele906.api.library.mapper.LibraryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.HtmlUtils;
import tools.jackson.databind.JsonNode;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LibraryService {

    @Value("${LIB_API_KEY}")
    String authKey;

    private final LibraryMapper libraryMapper;

    public int syncLibraries() {

        RestClient restClient = RestClient.builder()
                .baseUrl("https://data4library.kr")
                .build();

        int nextPage = 1;
        int pageSize = 100;
        int processedCount = 0;

        while (true) {

            int currentPage = nextPage;

            System.out.println("===== API 요청 시작 page: " + currentPage);

            JsonNode response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/libSrch")
                            .queryParam("authKey", authKey)
                            .queryParam("pageNo", currentPage)
                            .queryParam("pageSize", pageSize)
                            .queryParam("format", "json")
                            .build())
                    .retrieve()
                    .body(JsonNode.class);

            System.out.println("===== API 응답 완료 page: " + currentPage);

            JsonNode responseNode = response.path("response");
            JsonNode libs = responseNode.path("libs");

            System.out.println(
                    "page=" + currentPage
                            + ", libs=" + libs.size()
                            + ", numFound=" + responseNode.path("numFound").asInt()
            );

            processedCount += saveLibraries(libs);

            System.out.println(
                    "===== DB 저장 완료 page: " + currentPage
                            + ", 누적=" + processedCount
            );

            int numFound = responseNode.path("numFound").asInt();

            if (nextPage * pageSize >= numFound) {
                break;
            }

            nextPage++;
        }

        return processedCount;
    }

    private int saveLibraries(JsonNode libs) {

        int processedCount = 0;

        for (JsonNode item : libs) {

            JsonNode lib = item.path("lib");

            System.out.println("libItem: " + lib);

            Library library = new Library();

            library.setLibCode(text(lib, "libCode"));
            library.setName(text(lib, "libName"));
            library.setAddress(cleanHtml(text(lib, "address")));
            library.setTel(text(lib, "tel"));
            library.setFax(text(lib, "fax"));
            library.setHomepage(text(lib, "homepage"));

            library.setLatitude(doubleValue(lib, "latitude"));
            library.setLongitude(doubleValue(lib, "longitude"));

            library.setClosedDays(text(lib, "closed"));
            library.setOperatingTime(text(lib, "operationTime"));
            library.setBookCount(intValue(lib, "BookCount"));

            processedCount += libraryMapper.insertLibrary(library);
        }

        return processedCount;
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

    public List<Library> searchLibraries(LibrarySearchRequest request) {
        return libraryMapper.searchLibraries(request);
    }

    public Library getLibrary(String libCode) {
        Library library = libraryMapper.getLibraryByLibCode(libCode);

        if (library == null) {
            throw new ResponseNotFoundException(
                    "도서관을 찾을 수 없습니다. libCode: " + libCode
            );
        }

        return library;
    }
}