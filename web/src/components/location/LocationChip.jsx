'use client';

import { ChevronDownIcon } from '../icons';
import { LocationIcon } from './display';
import { useLocationState, useOpenLocationPicker } from './LocationProvider';
import styles from './LocationChip.module.css';

/*
 * 지금 기준 위치를 보여주고, 누르면 기준 위치 고르기 창을 여는 칩.
 *   저장한 위치: [집 아이콘] 집 ▾  (주소는 번지까지 오므로 칩에는 이름만)
 *   이번만 쓰는 위치: [핀] 부평역 ▾
 *   기본값: 점선 테두리 [핀] 서울 시청 (기본) ▾
 * 서버 렌더링 때는 localStorage를 몰라서 글자 자리만 잡아 둔다.
 */
export default function LocationChip({ className }) {
    const state = useLocationState();
    const open = useOpenLocationPicker();
    const base = state?.base;

    const sub = base?.kind === 'default' ? '(기본)' : null;

    return (
        <button
            type="button"
            onClick={open}
            aria-haspopup="dialog"
            aria-label={base ? `기준 위치 바꾸기, 지금은 ${base.label}` : '기준 위치 바꾸기'}
            data-kind={base?.kind ?? 'loading'}
            className={className ? `${styles.chip} ${className}` : styles.chip}
        >
            <span className={styles.icon}>
                <LocationIcon kind={base?.kind} label={base?.label} size={18} strokeWidth={2.2} />
            </span>
            {base ? (
                <span className={styles.text}>
                    <span className={styles.label}>{base.label}</span>
                    {sub && <span className={styles.sub}>{sub}</span>}
                </span>
            ) : (
                <span className={styles.placeholder} />
            )}
            <ChevronDownIcon size={16} className={styles.chevron} />
        </button>
    );
}

// 기준 위치 고르기 창을 여는 다른 모양의 버튼 (메인의 "내 주변 도서관" 등)
export function OpenLocationButton({ className, children }) {
    const open = useOpenLocationPicker();
    return (
        <button type="button" onClick={open} aria-haspopup="dialog" className={className}>
            {children}
        </button>
    );
}
