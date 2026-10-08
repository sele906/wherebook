package com.sele906.chaekeodi.external;

import com.sele906.chaekeodi.common.exception.ExternalApiException;
import com.sele906.chaekeodi.place.domain.AddressResponse;
import com.sele906.chaekeodi.place.domain.PlaceResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;

import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JusoClient {

    private final RestClient jusoRestClient;

    @Value("${juso.api.auth-key}")
    private String authKey;

    //장소 검색결과 호출
    public List<AddressResponse> fetchAddress(String keyword) {

        JsonNode res = get("/addrlink/addrLinkApi.do", Map.of(
                "currentPage", 1,
                "countPerPage", 10,
                "keyword", keyword
        ));

        JsonNode results = res.path("results");
        JsonNode common = results.path("common");

        if (!"0".equals(common.path("errorCode").asText())) {
            throw new IllegalStateException(
                    "주소 검색 API 오류: " +
                            common.path("errorMessage").asText()
            );
        }

        List<AddressResponse> addresses = new ArrayList<>();

        for (JsonNode juso : results.path("juso")) {
            addresses.add(new AddressResponse(
                    juso.path("bdNm").asText(),
                    juso.path("roadAddrPart1").asText(),
                    juso.path("admCd").asText(),
                    juso.path("rnMgtSn").asText(),
                    juso.path("emdNm").asText(),
                    juso.path("udrtYn").asText(),
                    juso.path("buldMnnm").asText(),
                    juso.path("buldSlno").asText()
            ));
        }

        //정확도순 정렬
        addresses.sort(Comparator.comparingInt(r -> matchScore(r.getName(), keyword)));

        return addresses;
    }

    // 검색어 일치
    private int matchScore(String bdNm, String keyword) {
        if (bdNm == null || bdNm.isBlank()) return 3;
        if (bdNm.equals(keyword)) return 0;        // 정확히 일치
        if (bdNm.startsWith(keyword)) return 1;    // 키워드로 시작
        return 2;                                  // 그외
    }

    // 공통 호출
    private JsonNode get(String path, Map<String, Object> params) {
        return jusoRestClient.get()
                .uri(b -> {
                    b.path(path)
                            .queryParam("confmKey", authKey)
                            .queryParam("resultType", "json");
                    params.forEach(b::queryParam);
                    return b.build();
                })
                .retrieve()
                .body(JsonNode.class);
    }
}
