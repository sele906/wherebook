'use client';

import LibraryMapLoader from '@/components/map/LibraryMapLoader';

import { usePlanSelection } from './PlanSelection';

/*
 * 고른 안(카드)의 도서관만 지도에 — 기준 위치에서 방문 순서대로 점선과 직선거리 (LibraryMap route 모드).
 * plans: { all, single } 각각 [{ libCode, name, latitude, longitude, order? }] (방문 순서) 또는 null.
 * 고른 안이 없으면(안이 하나뿐) 있는 쪽을 그린다 — RouteDirections와 같은 규칙.
 */
export default function RouteMapView({ base, plans, radiusKm }) {
    const { plan } = usePlanSelection();
    const libraries = plans[plan] ?? plans.all ?? plans.single ?? [];

    return <LibraryMapLoader base={base} libraries={libraries} radiusKm={radiusKm} route={libraries.length > 0} />;
}
