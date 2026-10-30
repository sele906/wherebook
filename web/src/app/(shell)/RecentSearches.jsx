'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';

import { CloseIcon } from '@/components/icons';
import {
    clearRecentSearches,
    getRecentServerSnapshot,
    getRecentSnapshot,
    removeRecentSearch,
    subscribeRecent,
} from '@/lib/recentSearches';

import styles from './page.module.css';

/*
 * 메인 "최근 검색어" 섹션. 검색어는 브라우저(localStorage)에만 있어서 서버 HTML에는 없고,
 * 하이드레이션 뒤에 나타난다. 검색어가 없으면(처음 온 사람, 다 지움) 섹션째 그리지 않는다.
 * 모바일은 한 줄 가로 스크롤(개수가 늘어도 높이 고정), 768px 이상은 줄바꿈.
 *
 * ✕로 지우면 포커스가 사라지지 않게 같은 자리(없으면 앞) 칩의 ✕로, 전부 지워지면 검색창으로 옮긴다.
 */
export default function RecentSearches({ inputId }) {
    const keywords = useSyncExternalStore(subscribeRecent, getRecentSnapshot, getRecentServerSnapshot);
    const listRef = useRef(null);
    const focusIndex = useRef(null);

    useEffect(() => {
        if (focusIndex.current === null) return;
        const index = focusIndex.current;
        focusIndex.current = null;

        const buttons = listRef.current?.querySelectorAll('button');
        if (buttons?.length) buttons[Math.min(index, buttons.length - 1)].focus();
        else document.getElementById(inputId)?.focus();
    }, [keywords, inputId]);

    if (keywords.length === 0) return null;

    function remove(keyword, index) {
        focusIndex.current = index;
        removeRecentSearch(keyword);
    }

    function clear() {
        focusIndex.current = 0;
        clearRecentSearches();
    }

    return (
        <section className={styles.recent} aria-labelledby="recent-heading">
            <div className={styles.sectionHead}>
                <h2 id="recent-heading" className={styles.sectionTitle}>
                    최근 검색어
                </h2>
                <button type="button" className={styles.textButton} onClick={clear}>
                    전체 삭제
                </button>
            </div>
            <ul ref={listRef} className={styles.chips}>
                {keywords.map((keyword, index) => (
                    <li key={keyword} className={styles.chip}>
                        <Link href={`/search?q=${encodeURIComponent(keyword)}`} className={styles.chipLink}>
                            <span className={styles.chipLabel}>{keyword}</span>
                        </Link>
                        {/* 링크 안에 버튼을 넣지 않으려고 옆에 붙임 */}
                        <button
                            type="button"
                            className={styles.chipRemove}
                            aria-label={`‘${keyword}’ 검색어 삭제`}
                            onClick={() => remove(keyword, index)}
                        >
                            <CloseIcon size={16} strokeWidth={2.2} />
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
