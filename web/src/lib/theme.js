/*
 * 화면 모드 (라이트 / 다크 / 시스템). 원본은 localStorage[THEME_STORAGE_KEY].
 *   'light' | 'dark' → <html data-theme>에 넣음
 *   없음 → 속성을 빼고 시스템 설정(prefers-color-scheme)을 따름 ('system')
 *
 * 첫 화면 깜빡임 방지: layout.js의 인라인 스크립트가 같은 키를 하이드레이션 전에 읽어서 넣는다.
 * 테마를 바꿀 때는 data-theme만 바뀌고 컴포넌트는 CSS 변수로 따라간다 (지도는 data-theme을 지켜봄).
 */

export const THEME_STORAGE_KEY = 'theme';
export const THEMES = ['system', 'light', 'dark'];

const listeners = new Set();

export function getThemeSnapshot() {
    try {
        const theme = localStorage.getItem(THEME_STORAGE_KEY);
        return theme === 'light' || theme === 'dark' ? theme : 'system';
    } catch {
        return 'system'; // 사생활 보호 모드 등에서 막힘
    }
}

// 서버에서는 모름 → null (아무것도 선택 안 된 모양으로 그렸다가 하이드레이션 뒤 채움)
export function getThemeServerSnapshot() {
    return null;
}

export function subscribeTheme(listener) {
    listeners.add(listener);
    // 다른 탭에서 바꾼 것도 반영 (그 탭의 data-theme도 맞춤)
    const onStorage = (e) => {
        if (e.key !== null && e.key !== THEME_STORAGE_KEY) return;
        applyTheme(getThemeSnapshot());
        listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
    };
}

function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
}

// 저장이 막혀도 이번 화면에는 적용한다
export function setTheme(theme) {
    try {
        if (theme === 'light' || theme === 'dark') localStorage.setItem(THEME_STORAGE_KEY, theme);
        else localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
        // 다음 방문엔 시스템 설정으로 돌아감
    }
    applyTheme(theme);
    listeners.forEach((listener) => listener());
}
