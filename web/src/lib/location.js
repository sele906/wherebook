/*
 * 기준 위치 = 거리를 재는 출발점. { label, latitude, longitude, isDefault? }
 *
 * 원본은 브라우저 localStorage(lib/locationStore.js — 저장한 위치 / 이번만 쓰는 위치)이고,
 * 서버에서 그리는 화면이 쓸 수 있게 "지금 쓰는 기준" 하나만 쿠키(BASE_COOKIE)에 복사한다.
 * 서버는 lib/base.js의 getBase()로 읽는다. 쿠키가 없으면 DEFAULT_BASE(서울 시청).
 *
 * GPS(현재 위치)는 쓰지 않는다 — 측위 좌표를 서버로 보내면 위치정보법 대상이라,
 * 주소 검색으로 고른 위치만 쓴다 (개인정보보호법 범위).
 */
export const DEFAULT_BASE = {
    label: '서울 시청',
    latitude: 37.5665,
    longitude: 126.978,
    isDefault: true,
};

export const BASE_COOKIE = 'wherebook-base';
export const BASE_LABEL_MAX = 20;

// 대략 국내 범위. 밖이면 잘못된 값으로 보고 기본값을 쓴다
function isValidCoord(latitude, longitude) {
    return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= 33 &&
        latitude <= 39 &&
        longitude >= 124 &&
        longitude <= 132
    );
}

export function encodeBaseCookie({ label, latitude, longitude }) {
    // 서버로 가는 좌표는 소수 3자리(약 100m)로 뭉갠다 — 장소 검색 좌표는 건물 위치까지 정확해서
    // 집·회사의 정확한 위치가 요청마다 서버로 가지 않게. 원래 좌표는 localStorage에만 남는다
    const round = (n) => Math.round(n * 1000) / 1000;
    return encodeURIComponent(JSON.stringify({ label, lat: round(latitude), lng: round(longitude) }));
}

// 쿠키 값 → 기준 위치. 형식이 틀리면 null
export function parseBaseCookie(value) {
    if (!value) return null;
    try {
        const { label, lat, lng } = JSON.parse(decodeURIComponent(value));
        if (typeof label !== 'string' || !label.trim() || !isValidCoord(lat, lng)) return null;
        return { label: label.trim().slice(0, BASE_LABEL_MAX), latitude: lat, longitude: lng };
    } catch {
        return null;
    }
}

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

// 기준 위치는 항상 글자로 (DESIGN.md) — "집 기준 3km"
export function describeBase(base, radiusKm) {
    return `${base.label} 기준 ${formatKm(radiusKm)}`;
}

// 기준 위치에서 좌표까지의 직선 거리(m). 하버사인 공식
export function distanceFromBase(base, latitude, longitude) {
    if (latitude == null || longitude == null) return null;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(latitude - base.latitude);
    const dLng = toRad(longitude - base.longitude);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(base.latitude)) * Math.cos(toRad(latitude)) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

// 화면이 기준 위치에 따라 다시 그려져야 할 때 Suspense key로 씀
export function baseKey(base) {
    return `${base.latitude},${base.longitude}`;
}
