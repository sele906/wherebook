package com.sele906.chaekeodi.external.kakao;

import com.sele906.chaekeodi.common.exception.ExternalApiException;
import com.sele906.chaekeodi.place.domain.PlaceSearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoClient {

    private final RestClient kakaoRestClient;

    //장소 검색결과 호출
    public List<PlaceSearchResponse> fetchPlaces(String keyword) {

        JsonNode res;

        try {
            res = kakaoRestClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v2/local/search/keyword.json")
                            .queryParam("query", keyword)
                            .queryParam("size", 10)
                            .build())
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.warn("카카오 장소 검색 실패 keyword={}", keyword, e);
            throw new ExternalApiException("카카오 장소 검색에 실패했습니다.", e);
        }

        if (res == null) {
            return List.of();
        }

        List<PlaceSearchResponse> places = new ArrayList<>();

        for (JsonNode doc : res.path("documents")) {

            // 좌표 없는 장소는 건너뛰기 (asDouble은 없으면 0.0을 반환)
            if (doc.path("x").asText().isBlank() || doc.path("y").asText().isBlank()) {
                continue;
            }

            // 도로명 주소 우선, 없으면 지번
            String road = doc.path("road_address_name").asText();
            String address = road.isBlank() ? doc.path("address_name").asText() : road;

            places.add(new PlaceSearchResponse(
                    doc.path("place_name").asText(),
                    address,
                    toCategory(doc)
            ));
        }

        return places;
    }

    // "지하철역" 같은 그룹명, 없으면 category_name의 마지막 단계
    private String toCategory(JsonNode doc) {

        String group = doc.path("category_group_name").asText();
        if (!group.isBlank()) return group;

        String full = doc.path("category_name").asText();
        if (full.isBlank()) return "";
        String[] parts = full.split(">");

        return parts[parts.length - 1].trim();
    }

}
