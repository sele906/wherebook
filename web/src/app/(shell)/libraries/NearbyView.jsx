'use client';

import { createContext, use, useState, useSyncExternalStore } from 'react';

import LibraryMapLoader from '@/components/map/LibraryMapLoader';

import styles from './page.module.css';

/*
 * 내 주변의 보기 방식 (목록 / 지도).
 * - 모바일·태블릿(~1023px): 제목 옆 토글로 목록과 지도를 오간다. 상태만 바꾸고 다시 불러오지 않는다
 *   (목록과 지도는 같은 API 응답을 공유 — CLAUDE.md). 지도 SDK는 지도를 처음 열 때 불러온다.
 * - 웹(1024px~): 왼쪽 패널(목록) + 오른쪽 지도가 같이 보여서 토글을 숨긴다.
 * 보이고 숨기는 건 CSS(main[data-view])가 맡고, 여기서는 상태와 지도를 띄울지만 정한다.
 * 고른 도서관(selected, libCode)도 여기서 가진다 — 목록(LibraryList)과 지도(MapPane)가 서로 다른 Suspense 안에 있어서.
 *   웹(목록·지도가 나란히)에서만 같이 쓴다. 모바일은 지도 보기에서 시트가 목록을 가려서 행 강조가 안 보이고,
 *   시트를 펼치려고 닿은 행이 선택되는 문제가 있어서 지도 안에서만 고른다.
 */

const NearbyViewContext = createContext({ view: 'list', setView: () => {}, selected: null, setSelected: () => {} });

export default function NearbyView({ className, children }) {
    const [view, setView] = useState('list');
    const [selected, setSelected] = useState(null);

    return (
        <NearbyViewContext value={{ view, setView, selected, setSelected }}>
            <main className={className} data-view={view}>
                {children}
            </main>
        </NearbyViewContext>
    );
}

// 목록과 지도가 같이 쓰는 고른 도서관
export function useNearbySelection() {
    const { selected, setSelected } = use(NearbyViewContext);
    return { selected, setSelected };
}

const VIEWS = [
    { value: 'map', label: '지도' },
    { value: 'list', label: '목록' },
];

// [지도 | 목록] 토글. 웹에서는 CSS로 숨김 (둘 다 보이므로)
export function ViewToggle() {
    const { view, setView } = use(NearbyViewContext);

    return (
        <div className={styles.viewToggle} role="group" aria-label="보기 방식">
            {VIEWS.map(({ value, label }) => (
                <button
                    key={value}
                    type="button"
                    className={styles.viewToggleItem}
                    aria-pressed={view === value}
                    onClick={() => setView(value)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

const WIDE_QUERY = '(min-width: 1024px)';

function subscribeWide(onChange) {
    const media = window.matchMedia(WIDE_QUERY);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
}

// 웹 폭인지. 서버에서는 모르므로 false (모바일 기준으로 지도를 아직 안 띄움)
export function useIsWide() {
    return useSyncExternalStore(
        subscribeWide,
        () => window.matchMedia(WIDE_QUERY).matches,
        () => false
    );
}

/*
 * 모바일 지도 보기의 바텀시트 (목업 "내 주변 · 책 검색 후"를 위치 기준으로).
 * 손잡이를 누르면 요약 ↔ 펼침 두 높이를 오간다. 웹에서는 왼쪽 패널이 목록이라 CSS로 숨김.
 * TODO: 끌어서 높이 바꾸기, 세 번째 높이(전체) — DESIGN.md 바텀시트 세 높이
 */
export function MapSheet({ title, summary, children }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <section className={styles.sheet} data-expanded={expanded} aria-labelledby="map-sheet-title">
            <button
                type="button"
                className={styles.sheetHandle}
                aria-label="목록 펼치기"
                aria-expanded={expanded}
                aria-controls="map-sheet-body"
                onClick={() => setExpanded(!expanded)}
            >
                <span className={styles.sheetHandleBar} aria-hidden="true" />
            </button>
            <div className={styles.sheetHead}>
                <h2 id="map-sheet-title" className={styles.sheetTitle}>
                    {title}
                </h2>
                {summary && <p className={styles.sheetSummary}>{summary}</p>}
            </div>
            <div id="map-sheet-body" className={styles.sheetBody}>
                {children}
            </div>
        </section>
    );
}

// 지도 칸 안의 실제 지도. 보이는 동안만 띄워서, 모바일에서 목록만 보는 사람은 지도 SDK를 받지 않는다
export function MapPane({ base, libraries, radiusKm, totalCount }) {
    const { view, selected, setSelected } = use(NearbyViewContext);
    const isWide = useIsWide();
    const [opened, setOpened] = useState(false);

    // 한 번 연 지도는 목록으로 돌아가도 유지 (다시 열 때 처음부터 그리지 않게)
    if (view === 'map' && !opened) setOpened(true);
    const active = isWide || view === 'map';
    if (!active && !opened) return null;

    // active: 지금 화면에 보이는지. 다시 보일 때 지도가 크기를 다시 재도록
    return (
        <LibraryMapLoader
            base={base}
            libraries={libraries}
            radiusKm={radiusKm}
            totalCount={totalCount}
            active={active}
            // 모바일은 넘기지 않아서 지도 안에서만 고른다
            selected={isWide ? selected : undefined}
            onSelect={isWide ? setSelected : undefined}
        />
    );
}
