/*
 * 브라우저 전용: 최근 검색어 (localStorage). 익명 사용자 기준, 서버로 보내지 않는다.
 *
 *   "wherebook:recentSearches" → ["최근 검색어", ...]  (최근 것이 앞, 최대 MAX_RECENT개)
 *
 * 검색창을 제출할 때 저장한다 (RecentSearchForm). 같은 검색어는 맨 앞으로 옮긴다.
 * TODO: 로그인이 생기면 서버로 옮길지 정하기 (locationStore와 같은 TODO).
 */

const KEY = 'wherebook:recentSearches';
export const MAX_RECENT = 7;
const MAX_LENGTH = 100;

const EMPTY = [];
const listeners = new Set();

function readRaw() {
    try {
        return localStorage.getItem(KEY);
    } catch {
        return null; // 사생활 보호 모드 등에서 막힘
    }
}

function parse(raw) {
    try {
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return EMPTY;
        return list.filter((q) => typeof q === 'string' && q !== '').slice(0, MAX_RECENT);
    } catch {
        return EMPTY;
    }
}

// useSyncExternalStore는 값이 같으면 같은 배열을 돌려받아야 해서 원문 문자열로 캐시
let cache = { raw: undefined, value: EMPTY };

export function getRecentSnapshot() {
    const raw = readRaw();
    if (raw !== cache.raw) cache = { raw, value: raw ? parse(raw) : EMPTY };
    return cache.value;
}

// 서버에서는 localStorage를 모름 → 빈 목록 (섹션을 그리지 않음)
export function getRecentServerSnapshot() {
    return EMPTY;
}

export function subscribeRecent(listener) {
    listeners.add(listener);
    // 다른 탭에서 바꾼 것도 반영
    const onStorage = (e) => {
        if (e.key === null || e.key === KEY) listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
    };
}

// 저장 실패는 조용히 넘긴다 — 최근 검색어 때문에 검색이 막히면 안 됨
function write(list, { notify = true } = {}) {
    try {
        if (list.length === 0) localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
        return;
    }
    if (notify) listeners.forEach((listener) => listener());
}

// 검색 제출 때 부른다. 지금 화면엔 알리지 않음 — 알리면 결과 화면으로 넘어가기 전에 메인에 칩이 먼저 생겨 보임.
// 메인에 다시 오면 저장소를 새로 읽으니 그때 보인다 (다른 탭은 storage 이벤트로 바로 반영).
export function addRecentSearch(value) {
    const q = typeof value === 'string' ? value.trim().slice(0, MAX_LENGTH) : '';
    if (!q) return;
    write([q, ...getRecentSnapshot().filter((item) => item !== q)].slice(0, MAX_RECENT), { notify: false });
}

export function removeRecentSearch(q) {
    write(getRecentSnapshot().filter((item) => item !== q));
}

export function clearRecentSearches() {
    write(EMPTY);
}
