package com.sele906.chaekeodi.place.service;

import com.sele906.chaekeodi.external.KakaoClient;
import com.sele906.chaekeodi.place.domain.PlaceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlaceService {

    private final KakaoClient kakaoClient;

    public List<PlaceResponse> searchPlaces(String keyword) {
        if (keyword == null || keyword.isBlank()) return List.of();

        //db에서 캐시 검색

        //만약 없으면 api 호출
        //호출 후 db에 저장

        return kakaoClient.fetchPlaces(keyword.trim());
    }
}
