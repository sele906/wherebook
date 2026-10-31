import RouteMapView from './RouteMapView';
import { loadRoute } from './loadRoute';

/*
 * 동선 지도. 결과 카드와 같은 응답 (loadRoute cache).
 * 안마다 지도에 그릴 도서관을 방문 순서대로 만들어 넘기고, 고른 안은 RouteMapView가 고른다.
 *   all    "N권 다 빌리기" — 순서 번호 핀 (결과 카드의 번호와 같음)
 *   single "한 곳만 가기"  — 번호 없는 도서관 핀. A안이 1곳이면 같은 말이라 없음 (RouteResult와 같은 규칙)
 * 불러오지 못했거나 빌릴 수 있는 곳이 없으면 기준 위치만 있는 지도.
 */
export default async function RouteMap({ base, isbnKey, radiusKm }) {
    const data = await loadRoute(isbnKey, base.latitude, base.longitude, radiusKm);
    const route = data?.allAvailableBooksRoute;
    const single = route?.stops.length === 1 ? null : data?.bestSingleLibrary;

    // 지도는 클라이언트로 넘어가서 HTML에 실리므로 핀에 필요한 값만
    const plans = {
        all: route ? route.stops.map((stop) => toPin(stop, stop.order)) : null,
        single: single ? [toPin(single)] : null,
    };

    return <RouteMapView base={base} plans={plans} radiusKm={radiusKm} />;
}

function toPin({ libCode, libName, latitude, longitude }, order) {
    return { libCode, name: libName, latitude, longitude, order };
}
