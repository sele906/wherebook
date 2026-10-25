import LibraryMapLoader from '@/components/map/LibraryMapLoader';

import { loadRoute } from './loadRoute';

/*
 * 동선 지도. 결과 카드와 같은 응답 (loadRoute cache).
 * 동선에 나온 도서관만 그린다 — "모두 빌리려면"의 방문 도서관 + "한 곳만 간다면" 도서관.
 * 불러오지 못했거나 빌릴 수 있는 곳이 없으면 기준 위치만 있는 지도.
 * TODO: 순서 번호 핀과 경로 선, 카드를 고르면 그 동선만 (LibraryMap이 아직 기본 마커만 그림)
 */
export default async function RouteMap({ base, isbnKey, radiusKm }) {
    const data = await loadRoute(isbnKey, base.latitude, base.longitude, radiusKm);

    const byCode = new Map();
    for (const stop of data?.allAvailableBooksRoute?.stops ?? []) {
        byCode.set(stop.libCode, stop);
    }
    const single = data?.bestSingleLibrary;
    if (single && !byCode.has(single.libCode)) byCode.set(single.libCode, single);

    // 지도는 클라이언트로 넘어가서 HTML에 실리므로 마커에 필요한 값만
    const libraries = [...byCode.values()].map(({ libCode, libName, latitude, longitude }) => ({
        libCode,
        name: libName,
        latitude,
        longitude,
    }));

    return <LibraryMapLoader base={base} libraries={libraries} radiusKm={radiusKm} />;
}
