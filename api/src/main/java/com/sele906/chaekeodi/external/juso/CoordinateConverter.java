package com.sele906.chaekeodi.external.juso;

import org.locationtech.proj4j.*;
import org.springframework.stereotype.Component;

@Component
public class CoordinateConverter {

    private final CoordinateTransform transform;

    public CoordinateConverter() {

        //좌표계 정의
        CRSFactory factory = new CRSFactory();

        var utmk = factory.createFromName("EPSG:5179");
        var wgs84 = factory.createFromName("EPSG:4326");

        //변환기 생성
        transform = new CoordinateTransformFactory()
                .createTransform(utmk, wgs84);
    }

    public LatLon toWgs84(double x, double y) {

        ProjCoordinate source = new ProjCoordinate(x, y);
        ProjCoordinate target = new ProjCoordinate();

        //실제 좌표 변환
        transform.transform(source, target);

        return new LatLon(target.y, target.x);
    }

    public record LatLon(
            double latitude,
            double longitude
    ) {}
}