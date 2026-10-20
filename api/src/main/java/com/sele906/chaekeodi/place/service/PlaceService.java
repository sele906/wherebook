package com.sele906.chaekeodi.place.service;

import com.sele906.chaekeodi.common.exception.ResponseNotFoundException;
import com.sele906.chaekeodi.external.juso.JusoClient;
import com.sele906.chaekeodi.external.kakao.KakaoClient;
import com.sele906.chaekeodi.place.domain.PlaceSearchResponse;
import com.sele906.chaekeodi.place.domain.PlaceCoordRequest;
import com.sele906.chaekeodi.place.domain.PlaceCoordResponse;
import com.sele906.chaekeodi.external.juso.JusoAddress;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PlaceService {

    private final KakaoClient kakaoClient;
    private final JusoClient jusoClient;

    //카카오 검색 목록 출력
    public List<PlaceSearchResponse> searchPlaces(String keyword) {
        return kakaoClient.fetchPlaces(keyword);
    }

    //사용자가 장소 선택 시 도로명 api 사용해서 좌표, 주소 불러옴
    //카카오 주소명 이랑 주소 api 주소명이랑 매칭하는게 중요함!
    public PlaceCoordResponse getCoord(String kakaoName, String kakaoAddress) {

        String cleaned = kakaoAddress
                .replaceAll("[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\\s-]", "")
                .trim();
        String target = normalize(cleaned);

        // 카카오 도로명주소로 검색 → 정규화해서 정확히 같은 결과만 채택
        JusoAddress matched = jusoClient.fetchAddress(cleaned).stream()
                .filter(j -> normalize(j.getAddress()).equals(target))
                .findFirst()
                .orElseThrow(() -> new ResponseNotFoundException("주소를 찾을 수 없습니다. 주소로 직접 검색해 주세요."));

        PlaceCoordRequest req = PlaceCoordRequest.builder()
                .name(kakaoName)
                .address(matched.getAddress())
                .admCd(matched.getAdmCd())
                .rnMgtSn(matched.getRnMgtSn())
                .udrtYn(matched.getUdrtYn())
                .buldMnnm(matched.getBuldMnnm())
                .buldSlno(matched.getBuldSlno())
                .build();

        return jusoClient.fetchCoord(req);
    }

    private String normalize(String address) {
        String s = address.trim();
        for (var e : SIDO.entrySet()) {
            if (s.startsWith(e.getKey())) {
                s = e.getValue() + s.substring(e.getKey().length());
                break;
            }
        }
        return s.replaceAll("\\s", "");   // 공백 전부 제거
    }

    private static final Map<String, String> SIDO = Map.ofEntries(
            Map.entry("서울특별시", "서울"), Map.entry("인천광역시", "인천"),
            Map.entry("부산광역시", "부산"), Map.entry("대구광역시", "대구"),
            Map.entry("광주광역시", "광주"), Map.entry("대전광역시", "대전"),
            Map.entry("울산광역시", "울산"), Map.entry("세종특별자치시", "세종"),
            Map.entry("경기도", "경기"), Map.entry("강원특별자치도", "강원"),
            Map.entry("충청북도", "충북"), Map.entry("충청남도", "충남"),
            Map.entry("전북특별자치도", "전북"), Map.entry("전라남도", "전남"),
            Map.entry("경상북도", "경북"), Map.entry("경상남도", "경남"),
            Map.entry("제주특별자치도", "제주")
    );

}
