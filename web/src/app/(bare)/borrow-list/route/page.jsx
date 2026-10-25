import { Suspense } from 'react';
import Link from 'next/link';

import { ROUTE_ISBN_LIMIT } from '@/api';
import BackLink from '@/components/BackLink';
import { PendingNavProvider, PendingSwap } from '@/components/PendingNav';
import LibraryMapSkeleton from '@/components/map/LibraryMapSkeleton';
import { getBase } from '@/lib/base';
import { isValidIsbn13 } from '@/lib/ids';
import {
    DEFAULT_ROUTE_RADIUS_KM,
    ROUTE_RADIUS_STEPS_KM,
    baseKey,
    describeBase,
    readRadiusKm,
} from '@/lib/location';

import RouteMap from './RouteMap';
import RouteResult from './RouteResult';
import RouteResultSkeleton from './RouteResultSkeleton';
import RouteSheet from './RouteSheet';
import RouteHeadText, { RouteHeadTextSkeleton } from './RouteHeadText';
import { PlanSelectionProvider } from './PlanSelection';
import styles from './page.module.css';

/*
 * 동선 추천 — /borrow-list/route?isbn=978...,978...&r=3
 * 빌릴 책에서 고른 책(isbn)을 어느 도서관에서, 어떤 순서로 빌릴지 보여주는 곳 (목업 "동선 추천").
 * 깊은 화면이라 (bare) 그룹: 탭 없이 뒤로가기.
 *
 * 동선 API(POST /api/route)는 도서관마다 대출 여부를 조회해서 몇 초 걸린다.
 * 머리 제목은 바로 보여주고, 부제·지도·결과 카드 자리만 Suspense로 기다린다 (같은 응답을 loadRoute cache로 공유).
 * 반경은 주소의 r(1·3·5km, 기본 1km). 반경 고르기는 없고 "반경 넓히기"로 다음 단계로 간다.
 */

export const metadata = {
    title: '동선 추천 | 책어디',
    // 사람마다 다른 개인 화면이라 색인하지 않음
    robots: { index: false, follow: false },
};

// "978...,978..." → 형식이 맞는 ISBN13만, 중복 없이. 동선 API가 받는 권수까지만
function readIsbns(value) {
    const raw = Array.isArray(value) ? value.join(',') : (value ?? '');
    const isbns = raw.split(',').map((s) => s.trim()).filter(isValidIsbn13);
    return [...new Set(isbns)].slice(0, ROUTE_ISBN_LIMIT);
}

function routeHref({ isbns, radiusKm }) {
    const params = new URLSearchParams({ isbn: isbns.join(',') });
    if (radiusKm !== DEFAULT_ROUTE_RADIUS_KM) params.set('r', String(radiusKm));
    return `/borrow-list/route?${params}`;
}

export default async function RoutePage({ searchParams }) {
    const params = await searchParams;
    const isbns = readIsbns(params.isbn);
    const radiusKm = readRadiusKm(params.r, ROUTE_RADIUS_STEPS_KM, DEFAULT_ROUTE_RADIUS_KM);
    const base = await getBase();

    const isbnKey = isbns.join(',');
    const resultsKey = `${isbnKey}:${radiusKm}:${baseKey(base)}`;
    // 빌릴 수 있는 책이 없을 때 "넓혀 보기" — 다음 단계 반경 (5km면 없음)
    const widenKm = ROUTE_RADIUS_STEPS_KM.find((km) => km > radiusKm);

    return (
        // data-map: 지도가 있는 화면 → 웹에서 왼쪽 패널 + 오른쪽 지도 (page.module.css)
        <main className={styles.main} data-map={isbns.length > 0 ? '' : undefined}>
            {isbns.length === 0 ? (
                <>
                    <header className={styles.head}>
                        <BackLink fallback="/borrow-list" className={styles.back} />
                        <div className={styles.headText}>
                            <h1 className={styles.title}>동선 추천</h1>
                            {/* 기준 위치는 항상 글자로 */}
                            <p className={styles.meta}>{describeBase(base, radiusKm)}</p>
                        </div>
                    </header>
                    <div className={styles.notice}>
                        <p className={styles.noticeTitle}>빌릴 책에서 동선을 짤 책을 골라 주세요</p>
                        <Link href="/borrow-list" className={styles.secondary}>
                            빌릴 책으로 가기
                        </Link>
                    </div>
                </>
            ) : (
                // "반경 넓히기"를 누르는 즉시 머리 글자·지도·결과 자리를 스켈레톤으로 (PendingNav 설명 참고).
                // 고른 안(A/B)은 카드와 지도가 같이 쓴다 (PlanSelection)
                <PendingNavProvider>
                    {/* 뒤로 버튼은 그대로, 글자(제목·부제)는 동선이 올 때까지 막대 (RouteHeadText 설명) */}
                    <header className={styles.head}>
                        <BackLink fallback="/borrow-list" className={styles.back} />
                        <PendingSwap fallback={<RouteHeadTextSkeleton />}>
                            <Suspense key={resultsKey} fallback={<RouteHeadTextSkeleton />}>
                                <RouteHeadText
                                    base={base}
                                    isbnKey={isbnKey}
                                    radiusKm={radiusKm}
                                    selectedCount={isbns.length}
                                />
                            </Suspense>
                        </PendingSwap>
                    </header>

                    <PlanSelectionProvider>
                        {/* 머리 바로 아래 지도. 반경은 주소의 r(기본 1km)이고 "반경 넓히기"로만 바꾼다 */}
                        <div className={styles.mapArea}>
                            <section className={styles.map} aria-label="지도">
                                <PendingSwap fallback={<LibraryMapSkeleton />}>
                                    <Suspense key={resultsKey} fallback={<LibraryMapSkeleton />}>
                                        <RouteMap base={base} isbnKey={isbnKey} radiusKm={radiusKm} />
                                    </Suspense>
                                </PendingSwap>
                            </section>
                        </div>

                        {/* 모바일: 지도 위 바텀시트 / 웹: 왼쪽 패널 */}
                        <RouteSheet>
                            <PendingSwap fallback={<RouteResultSkeleton />}>
                                <Suspense key={resultsKey} fallback={<RouteResultSkeleton />}>
                                    <RouteResult
                                        base={base}
                                        isbnKey={isbnKey}
                                        radiusKm={radiusKm}
                                        retryHref={routeHref({ isbns, radiusKm })}
                                        widenHref={widenKm ? routeHref({ isbns, radiusKm: widenKm }) : null}
                                        widenKm={widenKm}
                                    />
                                </Suspense>
                            </PendingSwap>
                        </RouteSheet>
                    </PlanSelectionProvider>
                </PendingNavProvider>
            )}
        </main>
    );
}
