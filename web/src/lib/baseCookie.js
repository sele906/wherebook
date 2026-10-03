/*
 * 기준 위치 쿠키. 브라우저가 localStorage의 기준(lib/locationStore.js)을 옮겨 적고 서버가 읽는다.
 * 쿠키는 요청마다 서버로 가므로 주소 기반일 때만 좌표를 넣는다 (CLAUDE.md "기준 위치 저장").
 *
 *   주소 기반 (default·saved·temp): { label, latitude, longitude }
 *   GPS:                            { source: 'gps' }   ← 좌표 없음
 *
 * 값은 JSON을 encodeURIComponent 해서 적는다 (따옴표·쉼표·한글). Next의 cookies()가 읽을 때 디코딩해 준다.
 * 서버·클라이언트 양쪽에서 쓰므로 next/headers 같은 한쪽 전용 모듈을 가져오지 않는다.
 */
export const BASE_COOKIE = 'wherebook_base';

const MAX_LABEL_LENGTH = 40;

function isLatitude(n) {
    return Number.isFinite(n) && n >= -90 && n <= 90;
}

function isLongitude(n) {
    return Number.isFinite(n) && n >= -180 && n <= 180;
}

/*
 * 쿠키 문자열 → { source: 'address', label, latitude, longitude } | { source: 'gps' } | null
 * 쿠키는 누구나 고칠 수 있으므로 모양과 범위를 검사하고, 틀리면 null (= 기본값을 쓰라는 뜻).
 */
export function parseBaseCookie(raw) {
    if (!raw) return null;

    let value;
    try {
        value = JSON.parse(raw);
    } catch {
        return null;
    }
    if (!value || typeof value !== 'object') return null;

    if (value.source === 'gps') return { source: 'gps' };

    const { label, latitude, longitude } = value;
    if (typeof label !== 'string' || label.trim() === '' || label.length > MAX_LABEL_LENGTH) return null;
    if (!isLatitude(latitude) || !isLongitude(longitude)) return null;

    return { source: 'address', label: label.trim(), latitude, longitude };
}
