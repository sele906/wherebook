'use client';

import { useSyncExternalStore } from 'react';

import { getThemeServerSnapshot, getThemeSnapshot, setTheme, subscribeTheme } from '@/lib/theme';

import styles from './page.module.css';

const OPTIONS = [
    { value: 'system', label: '시스템' },
    { value: 'light', label: '라이트' },
    { value: 'dark', label: '다크' },
];

/*
 * 화면 모드 세그먼트. 누르면 바로 바뀌고 다음 방문에도 유지된다 (lib/theme.js).
 * 저장 값은 브라우저에만 있어서 서버 HTML에선 아무것도 선택 안 된 모양 → 하이드레이션 뒤 채움.
 */
export default function ThemeSetting({ labelledBy }) {
    const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);

    return (
        <div role="group" aria-labelledby={labelledBy} className={styles.segment}>
            {OPTIONS.map(({ value, label }) => (
                <button
                    key={value}
                    type="button"
                    className={styles.segmentItem}
                    aria-pressed={theme === value}
                    onClick={() => setTheme(value)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
