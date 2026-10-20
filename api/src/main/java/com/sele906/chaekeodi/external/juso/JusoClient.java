package com.sele906.chaekeodi.external.juso;

import com.sele906.chaekeodi.common.exception.ResponseNotFoundException;
import com.sele906.chaekeodi.place.domain.PlaceCoordRequest;
import com.sele906.chaekeodi.place.domain.PlaceCoordResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JusoClient {

    private final RestClient jusoRestClient;
    private final CoordinateConverter coordConverter;

    @Value("${juso.api.addr-key}")
    private String addrAuthKey;

    @Value("${juso.api.coord-key}")
    private String coordAuthKey;

    //장소 검색결과 호출
    public List<JusoAddress> fetchAddress(String keyword) {

        JsonNode res = call(HttpMethod.GET, "/addrlink/addrLinkApi.do", addrAuthKey, Map.of(
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

        List<JusoAddress> addresses = new ArrayList<>();

        for (JsonNode juso : results.path("juso")) {
            addresses.add(JusoAddress.builder()
                    .name(juso.path("bdNm").asText())
                    .address(juso.path("roadAddrPart1").asText())
                    .emdNm(juso.path("emdNm").asText())
                    .admCd(juso.path("admCd").asText())
                    .rnMgtSn(juso.path("rnMgtSn").asText())
                    .udrtYn(juso.path("udrtYn").asText())
                    .buldMnnm(juso.path("buldMnnm").asText())
                    .buldSlno(juso.path("buldSlno").asText())
                    .build());
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

    //좌표 호출
    public PlaceCoordResponse fetchCoord(PlaceCoordRequest req) {

        JsonNode res = call(HttpMethod.POST, "/addrlink/addrCoordApi.do", coordAuthKey, Map.of(
                "admCd", req.getAdmCd(),
                "rnMgtSn", req.getRnMgtSn(),
                "udrtYn", req.getUdrtYn(),
                "buldMnnm", req.getBuldMnnm(),
                "buldSlno", req.getBuldSlno()
        ));

        JsonNode results = res.path("results");

        String errorCode = results.path("common").path("errorCode").asText();

        if (!"0".equals(errorCode)) {
            throw new IllegalStateException(
                    "주소 좌표 API 오류: " + results.path("common").path("errorMessage").asText()
            );
        }

        JsonNode coordResults = results.path("juso");

        if (!coordResults.isArray() || coordResults.isEmpty()) {
            throw new ResponseNotFoundException(
                    "주소 좌표를 찾을 수 없습니다."
            );
        }

        JsonNode coordItem = coordResults.get(0);
        double x = Double.parseDouble(coordItem.path("entX").asText());
        double y = Double.parseDouble(coordItem.path("entY").asText());
        var coords = coordConverter.toWgs84(x, y);

        return new PlaceCoordResponse(req.getName(), req.getAddress(), coords.latitude(), coords.longitude());
    }

    // 공통 호출
    private JsonNode call(HttpMethod method, String path, String key, Map<String, Object> params) {
        return jusoRestClient.method(method)
                .uri(b -> {
                    b.path(path)
                            .queryParam("confmKey", key)
                            .queryParam("resultType", "json");
                    params.forEach(b::queryParam);
                    return b.build();
                })
                .retrieve()
                .body(JsonNode.class);
    }
}
