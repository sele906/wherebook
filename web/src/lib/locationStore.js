import { BASE_COOKIE } from './baseCookie';
import { DEFAULT_BASE } from './location';

/*
 * 브라우저(localStorage)에만 두는 사용자 값: 사용자 ID, 저장한 위치, 지금 쓰는 기준 위치.
 * localStorage는 서버가 볼 수 없으므로 이 파일의 함수는 클라이언트에서만 부른다 (useEffect·이벤트 핸들러 안).
 *
 * GPS 좌표는 어디에도 저장하지 않는다. activeLocation에는 { type: 'gps' }만 남기고,
 * 좌표는 앱을 켤 때마다 다시 측정해서 React state에만 들고 있는다.
 *
 * activeLocation:
 *   { type: 'default' }                                   서울 시청 (DEFAULT_BASE)
 *   { type: 'gps' }                                       현재 위치 (좌표 저장 안 함)
 *   { type: 'saved', id: 'loc_1' }                        저장한 위치 (좌표는 savedLocations에서 찾음)
 *   { type: 'temp', label, latitude, longitude }          "다른 위치 검색…"으로 고른 이번만 쓰는 위치
 *
 * savedLocations (최대 5개):
 *   [{ id: 'loc_1', label: '집', address: '인천 부평구 ...', latitude, longitude }]
 *
 * 서버 화면이 기준을 알 수 있게 syncBaseCookie()가 지금 기준을 쿠키(lib/baseCookie.js)에 옮겨 적는다.
 *
 * TODO: 위치 입력 UI가 생기면 savedLocations·activeLocation을 쓰는 함수를 여기에 추가하고,
 *       저장한 뒤 syncBaseCookie()가 true면 router.refresh() 한다.
 */

const KEY = {
    userId: 'wherebook:userId',
    saved: 'wherebook:savedLocations',
    active: 'wherebook:activeLocation',
};

function read(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback; // 손상된 값이나 접근 차단 대비
    }
}

function hasCoords(location) {
    return Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude);
}

// 사용자 ID (빌릴 책 목록의 열쇠). 저장이 막힌 브라우저에선 이번 페이지 동안만 쓰는 ID
let memoryUserId = null;

export function getOrCreateUserId() {
    try {
        let id = localStorage.getItem(KEY.userId);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(KEY.userId, id);
        }
        return id;
    } catch {
        memoryUserId ??= crypto.randomUUID();
        return memoryUserId;
    }
}

/*
 * 지금 기준 위치의 { label, latitude, longitude }. 화면은 type을 신경 쓰지 않고 이것만 쓴다.
 * gpsPosition: 이번 세션에서 측정한 좌표 { latitude, longitude } (React state에서 넘겨줌).
 * GPS 권한 거부·측정 중이거나 저장한 위치가 지워졌으면 DEFAULT_BASE로 떨어진다.
 */
export function resolveBase(gpsPosition) {
    const active = read(KEY.active, { type: 'default' });

    if (active?.type === 'gps' && hasCoords(gpsPosition)) {
        return { label: '현재 위치', latitude: gpsPosition.latitude, longitude: gpsPosition.longitude };
    }
    if (active?.type === 'saved') {
        const saved = read(KEY.saved, []);
        const found = Array.isArray(saved) ? saved.find((l) => l?.id === active.id) : null;
        if (hasCoords(found)) return found;
    }
    if (active?.type === 'temp' && hasCoords(active)) {
        return active;
    }
    return DEFAULT_BASE;
}

/*
 * 쿠키에 적을 값. GPS면 좌표 없이 { source: 'gps' }만.
 * 기본값(서울 시청)이면 null → 쿠키를 지운다 (서버도 쿠키가 없으면 기본값).
 */
function baseCookieValue() {
    const active = read(KEY.active, { type: 'default' });
    if (active?.type === 'gps') return { source: 'gps' };

    const base = resolveBase();
    if (base === DEFAULT_BASE) return null;
    return { label: base.label, latitude: base.latitude, longitude: base.longitude };
}

function readCookie(name) {
    const prefix = `${name}=`;
    const found = document.cookie.split('; ').find((c) => c.startsWith(prefix));
    if (!found) return null;
    try {
        return decodeURIComponent(found.slice(prefix.length));
    } catch {
        return null;
    }
}

/*
 * localStorage의 기준을 쿠키에 맞춘다. 쿠키가 실제로 바뀌었으면 true (→ 부른 쪽에서 router.refresh()).
 * 이미 같으면 아무것도 안 하고 false — 페이지를 열 때마다 다시 그리지 않게.
 */
export function syncBaseCookie() {
    const value = baseCookieValue();
    const next = value ? JSON.stringify(value) : null;
    if (readCookie(BASE_COOKIE) === next) return false;

    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = next
        ? `${BASE_COOKIE}=${encodeURIComponent(next)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`
        : `${BASE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    return true;
}
