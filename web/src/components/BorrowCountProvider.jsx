'use client';

import { createContext, Suspense, use, useCallback, useEffect, useRef, useState } from 'react';

/*
 * 빌릴 책 권수 — 하단 탭(TabBar)·웹 헤더(SiteHeader) 배지가 같이 본다. AppFrame이 감싼다.
 * 원본은 API이고 프론트에 따로 저장하지 않는다.
 * - 처음 값: 서버가 빌릴 책 목록으로 센 권수를 Promise로 넘긴다(initialCount). 배지는 그 값이 오는 대로
 *   HTML에 바로 그려져서 JS·하이드레이션을 기다리지 않는다. 서버가 못 셌으면 null(배지 숨김).
 * - 빌릴 책 화면: 목록을 들고 있으므로 setCount(items.length)로 맞춘다
 * - 추가 버튼(책 상세·검색 결과): 누르는 즉시 changeCount(±1), 실패하면 반대로 되돌린다
 * (shell)과 (bare)는 AppFrame이 따로라서 그룹을 오가면 서버에서 다시 센다 → 다른 화면에서 바꾼 값도 맞춰짐.
 */

const BorrowCountContext = createContext(null);

export default function BorrowCountProvider({ initialCount, children }) {
    // null = 화면에서 아직 바꾼 적 없음 → 서버 값(initialCount)을 보여줌
    const [count, setCount] = useState(null);
    // 서버 값이 도착하면 기억해 둔다 (±1을 서버 값 기준으로 하기 위해)
    const baseRef = useRef(null);
    useEffect(() => {
        initialCount.then((n) => {
            baseRef.current = n;
        });
    }, [initialCount]);

    const changeCount = useCallback((delta) => {
        setCount((prev) => {
            const current = prev ?? baseRef.current;
            return current === null ? null : Math.max(0, current + delta);
        });
    }, []);

    return (
        <BorrowCountContext value={{ count, initialCount, setCount, changeCount }}>
            {children}
        </BorrowCountContext>
    );
}

export function useBorrowCount() {
    return use(BorrowCountContext);
}

const countFormat = new Intl.NumberFormat('ko-KR');

// 권수 배지. 0이거나 모르면 숨긴다. 서버 값이 오기 전에는 아무것도 그리지 않음 (자리 차지 없음)
export function BorrowCountBadge({ className }) {
    return (
        <Suspense fallback={null}>
            <Badge className={className} />
        </Suspense>
    );
}

function Badge({ className }) {
    const { count, initialCount } = useBorrowCount();
    const serverCount = use(initialCount);
    const shown = count ?? serverCount;
    if (!shown) return null;

    return (
        <>
            {/* 숫자는 장식이고 스크린리더에는 "N권"으로 읽힌다 */}
            <span className={className} aria-hidden="true">
                {countFormat.format(shown)}
            </span>
            <span className="sr-only">{`${countFormat.format(shown)}권`}</span>
        </>
    );
}
