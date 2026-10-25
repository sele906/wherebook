package com.sele906.chaekeodi.place.controller;

import com.sele906.chaekeodi.external.juso.JusoCoordQuery;
import com.sele906.chaekeodi.place.domain.*;
import com.sele906.chaekeodi.place.service.PlaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceService placeService;

    @GetMapping
    public List<PlaceSearchResponse> searchPlaces(@Valid @ModelAttribute PlaceSearchRequest request) {
        return placeService.searchPlaces(request.getKeyword());
    }

    @GetMapping("/coord")
    public PlaceCoordResponse getCoord(@Valid @ModelAttribute JusoCoordQuery request) {
        return placeService.getCoord(request.getName(), request.getAddress());
    }
}
