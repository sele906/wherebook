/*
 * 기준 위치(내 위치 / 직접 고른 지역 / 지도 중심).
 *
 * TODO: 위치 입력 UI가 생기면 사용자가 고른 기준을 쿠키에 저장하고 서버에서 읽어 쓴다.
 *       그 전까지는 모든 화면이 아래 기본값(서울 시청)을 기준으로 한다.
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
export function describeBase(radiusKm) {
    return `${DEFAULT_BASE.label} 기준 ${formatKm(radiusKm)}`;
}
