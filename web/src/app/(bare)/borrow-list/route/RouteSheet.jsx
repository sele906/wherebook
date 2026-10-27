'use client';

import { useEffect, useRef, useState } from 'react';

import styles from './page.module.css';

/*
 * 모바일·태블릿 바텀시트 (내 주변 지도 보기의 MapSheet와 같은 모양).
 * 지도가 화면을 채우고, 동선 결과가 아래에서 올라온다. 손잡이를 누르면 요약 ↔ 펼침 두 높이를 오간다.
 * 웹(1024px~)에서는 CSS로 시트를 풀어서(display: contents) 안의 결과가 왼쪽 패널에 그대로 놓인다.
 * TODO: 끌어서 높이 바꾸기, 세 번째 높이(전체) — DESIGN.md 바텀시트 세 높이
 */
export default function RouteSheet({ children }) {
    const [expanded, setExpanded] = useState(false);
    const ref = useRef(null);

    // 접힌 시트 높이를 지도에 알려서 카카오 로고가 가리지 않게 (LibraryMap --map-inset-bottom).
    // 시트 높이가 내용(책·도서관 수)에 따라 달라서 CSS만으로는 못 정함. 펼쳤을 때는 접힌 높이를 그대로 둔다
    useEffect(() => {
        const sheet = ref.current;
        const main = sheet?.closest('main');
        if (!sheet || !main || expanded) return;
        const observer = new ResizeObserver(() => {
            main.style.setProperty('--map-inset-bottom', `calc(${sheet.offsetHeight}px + var(--space-1))`);
        });
        observer.observe(sheet);
        return () => observer.disconnect();
    }, [expanded]);

    return (
        <section ref={ref} className={styles.sheet} data-expanded={expanded} aria-label="동선 결과">
            <button
                type="button"
                className={styles.sheetHandle}
                aria-label="동선 결과 펼치기"
                aria-expanded={expanded}
                aria-controls="route-sheet-body"
                onClick={() => setExpanded(!expanded)}
            >
                <span className={styles.sheetHandleBar} aria-hidden="true" />
            </button>
            <div id="route-sheet-body" className={styles.sheetBody}>
                {children}
            </div>
        </section>
    );
}
