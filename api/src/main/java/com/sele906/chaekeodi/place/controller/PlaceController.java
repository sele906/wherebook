package com.sele906.chaekeodi.place.controller;

import com.sele906.chaekeodi.external.KakaoClient;
import com.sele906.chaekeodi.place.domain.AddressResponse;
import com.sele906.chaekeodi.place.domain.PlaceResponse;
import com.sele906.chaekeodi.place.domain.PlaceSearchRequest;
import com.sele906.chaekeodi.place.service.PlaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceService placeService;

    @GetMapping
    public List<AddressResponse> searchPlaces(
            @ModelAttribute PlaceSearchRequest request
            ) {
        return placeService.searchPlaces(request.getKeyword());
    }
}
