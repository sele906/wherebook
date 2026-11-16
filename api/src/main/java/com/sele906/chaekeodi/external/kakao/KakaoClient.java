package com.sele906.chaekeodi.external.kakao;

import com.sele906.chaekeodi.common.exception.BadRequestException;
import com.sele906.chaekeodi.common.exception.ExternalApiException;
import com.sele906.chaekeodi.external.common.ApiMeter;
import com.sele906.chaekeodi.place.domain.PlaceSearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoClient {

    private final ApiMeter apiMeter;
    private final RestClient kakaoRestClient;

    //장소 검색결과 호출
    public List<PlaceSearchResponse> fetchPlaces(String keyword) {

        if (keyword == null || keyword.isBlank()) {
            throw new BadRequestException("검색어를 입력해 주세요.");
        }

        JsonNode res = call(HttpMethod.GET, "/v2/local/search/keyword.json", Map.of(
                "query", keyword,
                "size", 10
        ));

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

    private JsonNode call(HttpMethod method, String path, Map<String, Object> params) {
        String error = null;

        try {

            JsonNode res = kakaoRestClient.method(method)
                    .uri(b -> {
                        b.path(path);
                        params.forEach(b::queryParam);
                        return b.build();
                    })
                    .retrieve()
                    .body(JsonNode.class);

            // 응답 없음
            if (res == null) {
                error = ApiMeter.EMPTY_RESPONSE;
                throw new ExternalApiException("카카오 API 응답이 없습니다.");
            }

            // 응답 구조 검증
            if (!res.path("documents").isArray()) {
                error = ApiMeter.INVALID_RESPONSE;
                throw new ExternalApiException("카카오 API 응답 형식 오류");
            }

            return res;

        } catch (RestClientException e) {
            error = ApiMeter.HTTP_ERROR;
            throw new ExternalApiException("카카오 API 호출 실패: ", e);
        } finally {
            apiMeter.record("KAKAO", path, error);
        }
    }
}
