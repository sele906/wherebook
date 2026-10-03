/*
 * 기준 위치(내 위치 / 직접 고른 지역 / 지도 중심).
 *
 * 사용자가 고른 기준의 원본은 브라우저 localStorage (lib/locationStore.js).
 * 서버 화면은 그 값을 옮겨 적은 쿠키를 getBase()(lib/getBase.js)로 읽고, 없으면 아래 기본값(서울 시청).
 * GPS 좌표는 쿠키에 넣지 않는다 (CLAUDE.md "기준 위치 저장").
 */
export const DEFAULT_BASE = {
    label: '서울 시청',
    latitude: 37.5665,
    longitude: 126.978,
};

// 반경 필터 4단계 (DESIGN.md: 1·3·5·10km)
export const RADIUS_STEPS_KM = [1, 3, 5, 10];
export const DEFAULT_RADIUS_KM = 3;

export function readRadiusKm(value) {
    const n = Number(Array.isArray(value) ? value[0] : value);
    return RADIUS_STEPS_KM.includes(n) ? n : DEFAULT_RADIUS_KM;
}

const kmFormat = new Intl.NumberFormat('ko-KR', {
    style: 'unit',
    unit: 'kilometer',
    maximumFractionDigits: 1,
});

const meterFormat = new Intl.NumberFormat('ko-KR', {
    style: 'unit',
    unit: 'meter',
    maximumFractionDigits: 0,
});

// 미터 → 1km 미만은 "30m"(10m 단위), 그 이상은 "1.4km" (언어에 따라 단위 표기가 바뀜)
export function formatDistance(meters) {
    if (meters < 950) return meterFormat.format(Math.max(10, Math.round(meters / 10) * 10));
    return kmFormat.format(meters / 1000);
}

export function formatKm(km) {
    return kmFormat.format(km);
}

// 기준 위치는 항상 글자로 (DESIGN.md) — "서울 시청 기준 3km"
export function describeBase(base, radiusKm) {
    return `${base.label} 기준 ${formatKm(radiusKm)}`;
}

// 기준 위치(base)에서 좌표까지의 직선 거리(m). 하버사인 공식
export function distanceFrom(base, latitude, longitude) {
    if (latitude == null || longitude == null) return null;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(latitude - base.latitude);
    const dLng = toRad(longitude - base.longitude);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(base.latitude)) * Math.cos(toRad(latitude)) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.sqrt(a));
}
