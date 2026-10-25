package com.sele906.chaekeodi.route.controller;

import com.sele906.chaekeodi.route.domain.RouteRequest;
import com.sele906.chaekeodi.route.domain.RouteResponse;
import com.sele906.chaekeodi.route.service.RouteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/route")
public class RouteController {

    private final RouteService routeService;

    @PostMapping
    public RouteResponse getCalcRoute(@Valid @RequestBody RouteRequest request) {
        return routeService.getCalcRoute(request);
    }
}
