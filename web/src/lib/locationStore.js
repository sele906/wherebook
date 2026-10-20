import { BASE_COOKIE, BASE_LABEL_MAX, DEFAULT_BASE, encodeBaseCookie } from './location';

/*
 * 브라우저 전용: 기준 위치의 원본 (localStorage). 익명 사용자 기준.
 *
 *   "wherebook:savedLocations" → [{ id, label, address, emdNm, latitude, longitude }]  (최대 MAX_SAVED개)
 *       address = "인천 부평구 체육관로 27", emdNm = "삼산동" (예전에 저장한 항목엔 emdNm이 없을 수 있음)
 *   "wherebook:activeLocation" →
 *       { type: "default" }                              서울 시청 (DEFAULT_BASE)
 *     | { type: "saved", id }                            저장한 위치
 *     | { type: "temp", label, latitude, longitude }     이번만 쓰는 위치 (저장 목록에는 안 들어감)
 *
 * 서버에서 그리는 화면을 위해 "지금 쓰는 기준" 하나를 쿠키에 복사한다 (syncBaseCookie).
 * 기본값일 때는 쿠키를 지운다.
 *
 * GPS는 뺐다: 예전 값 { type: "gps" }가 남아 있으면 기본값으로 본다.
 * TODO: 로그인이 생기면 저장한 위치를 서버(개인정보 처리방침·탈퇴 시 파기)로 옮길지 정하기.
 */

const SAVED_KEY = 'wherebook:savedLocations';
const ACTIVE_KEY = 'wherebook:activeLocation';
export const MAX_SAVED = 5;

const listeners = new Set();

function readRaw(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null; // 사생활 보호 모드 등에서 막힘
    }
}

// 실패하면 그대로 던진다 — 부르는 쪽이 "저장하지 못했어요"를 보여줌
function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function isCoord(n) {
    return typeof n === 'number' && Number.isFinite(n);
}

function parseSaved(raw) {
    try {
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return [];
        return list
            .filter(
                (loc) =>
                    loc &&
                    typeof loc.id === 'string' &&
                    typeof loc.label === 'string' &&
                    isCoord(loc.latitude) &&
                    isCoord(loc.longitude),
            )
            .slice(0, MAX_SAVED);
    } catch {
        return [];
    }
}

function parseActive(raw) {
    try {
        const active = JSON.parse(raw);
        if (active?.type === 'saved' && typeof active.id === 'string') return active;
        if (
            active?.type === 'temp' &&
            typeof active.label === 'string' &&
            isCoord(active.latitude) &&
            isCoord(active.longitude)
        ) {
            return active;
        }
    } catch {
        // 아래 기본값
    }
    return { type: 'default' };
}

// useSyncExternalStore는 값이 같으면 같은 객체를 돌려받아야 해서 원문 문자열로 캐시
let cache = { savedRaw: undefined, activeRaw: undefined, value: null };

export function getLocationSnapshot() {
    const savedRaw = readRaw(SAVED_KEY);
    const activeRaw = readRaw(ACTIVE_KEY);
    if (cache.value && savedRaw === cache.savedRaw && activeRaw === cache.activeRaw) return cache.value;

    const saved = parseSaved(savedRaw);
    const active = parseActive(activeRaw);
    cache = { savedRaw, activeRaw, value: { saved, active, base: resolveBase(saved, active) } };
    return cache.value;
}

// 서버에서는 localStorage를 모름 → null (화면은 자리만 잡아 둠)
export function getLocationServerSnapshot() {
    return null;
}

export function subscribeLocation(listener) {
    listeners.add(listener);
    // 다른 탭에서 바꾼 것도 반영
    const onStorage = (e) => {
        if (e.key === null || e.key === SAVED_KEY || e.key === ACTIVE_KEY) listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
    };
}

function notify() {
    listeners.forEach((listener) => listener());
}

/*
 * 지금 쓰는 기준 → { kind: 'saved'|'temp'|'default', id?, label, address?, latitude, longitude }
 * 저장한 위치를 지웠는데 active가 그 id를 가리키면 기본값으로.
 */
function resolveBase(saved, active) {
    if (active.type === 'saved') {
        const loc = saved.find((item) => item.id === active.id);
        if (loc) return { kind: 'saved', ...loc };
    }
    if (active.type === 'temp') {
        return { kind: 'temp', label: active.label, latitude: active.latitude, longitude: active.longitude };
    }
    return { kind: 'default', ...DEFAULT_BASE };
}

/* ---- 쓰기 ---- */

function cleanLabel(label, fallback) {
    const text = (label ?? '').trim().slice(0, BASE_LABEL_MAX);
    return text || fallback;
}

export function selectSaved(id) {
    writeJson(ACTIVE_KEY, { type: 'saved', id });
    notify();
}

export function selectDefault() {
    writeJson(ACTIVE_KEY, { type: 'default' });
    notify();
}

// place = { name, address, latitude, longitude } (GET /api/places/coord 응답)
export function selectTemp(place) {
    writeJson(ACTIVE_KEY, {
        type: 'temp',
        label: cleanLabel(place.name, place.address),
        latitude: place.latitude,
        longitude: place.longitude,
    });
    notify();
}

// 새로 저장. 꽉 찼으면 null. activate면 바로 기준으로
export function saveLocation(place, label, { activate }) {
    const { saved } = getLocationSnapshot();
    if (saved.length >= MAX_SAVED) return null;

    const id = `loc_${crypto.randomUUID().slice(0, 8)}`;
    writeJson(SAVED_KEY, [
        ...saved,
        {
            id,
            label: cleanLabel(label, place.name),
            address: place.address,
            emdNm: place.emdNm ?? '',
            latitude: place.latitude,
            longitude: place.longitude,
        },
    ]);
    if (activate) writeJson(ACTIVE_KEY, { type: 'saved', id });
    notify();
    return id;
}

export function renameLocation(id, label) {
    const { saved } = getLocationSnapshot();
    writeJson(
        SAVED_KEY,
        saved.map((loc) => (loc.id === id ? { ...loc, label: cleanLabel(label, loc.label) } : loc)),
    );
    notify();
}

// 쓰던 위치를 지우면 resolveBase가 기본값으로 돌려놓음
export function removeLocation(id) {
    const { saved } = getLocationSnapshot();
    writeJson(
        SAVED_KEY,
        saved.filter((loc) => loc.id !== id),
    );
    notify();
}

/* ---- 쿠키 복사 ---- */

function readCookie(name) {
    const prefix = `${name}=`;
    return document.cookie
        .split('; ')
        .find((part) => part.startsWith(prefix))
        ?.slice(prefix.length);
}

// 지금 기준을 쿠키에 맞춰 둔다. 바뀌었으면 true (→ 서버 화면을 다시 불러와야 함)
export function syncBaseCookie(base) {
    const want = base.kind === 'default' ? undefined : encodeBaseCookie(base);
    if (readCookie(BASE_COOKIE) === want) return false;

    document.cookie = want
        ? // 브라우저 최대 보관 기간(약 400일)에 맞춤. 쓸 때마다 늘어남
          `${BASE_COOKIE}=${want}; Path=/; Max-Age=34560000; SameSite=Lax`
        : `${BASE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    return true;
}
