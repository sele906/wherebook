import { Suspense } from 'react';
import Link from 'next/link';

import { ApiError, searchLibraries } from '@/api';
import LibraryRow from '@/components/LibraryRow';
import Pager, { readPage } from '@/components/Pager';
import { PendingForm, PendingLink, PendingNavProvider, PendingSwap } from '@/components/PendingNav';
import SearchField from '@/components/SearchField';
import { NextIcon } from '@/components/icons';
import {
    DEFAULT_BASE,
    DEFAULT_RADIUS_KM,
    RADIUS_STEPS_KM,
    describeBase,
    formatKm,
    readRadiusKm,
} from '@/lib/location';

import ResultsSkeleton from './ResultsSkeleton';
import styles from './page.module.css';

/*
 * 내 주변 도서관 목록 — /libraries?q=도서관이름&r=3&page=2
 * 기준 위치에서 반경 안의 도서관을 거리순으로. 검색어도 반경 안에서만 찾는다.
 * 보는 사람 위치에 따라 내용이 바뀌는 화면이라 noindex (링크는 따라가게 follow).
 *
 * TODO: 기준 위치 — 위치 입력 UI가 생기면 쿠키의 기준 위치를 쓴다. 지금은 DEFAULT_BASE(서울 시청).
 * TODO: 지도/목록 전환 — 지도 화면이 생기면 h1 옆에 추가. 지도와 목록은 같은 API 응답을 공유.
 * TODO: 운영 상태("운영 중 · 22시까지" / "오늘 휴관") — 운영시간·휴관일 데이터 정제 필요.
 *       지금 operatingTime·closedDays는 자유 형식 글이라 계산할 수 없음 (백엔드 작업).
 * TODO: 지역별 도서관 목록 (색인용) — /libraries/region/[regionCode](/[dtlRegionCode]) 를 따로 만들어
 *       index 대상으로. 위치와 상관없이 주소마다 내용이 고정된 페이지가 검색엔진 입구가 됨.
 * TODO: 정렬 — 백엔드가 거리순만 지원. 다른 정렬이 생기면 결과 수 옆에 추가.
 */

const PAGE_SIZE = 20;
const numberFormat = new Intl.NumberFormat('ko-KR');

export const metadata = {
    title: '내 주변 도서관 | 책어디',
    robots: { index: false, follow: true },
};

function readQuery(value) {
    const raw = Array.isArray(value) ? value[0] : value;
    return (raw ?? '').trim();
}

function librariesHref({ q, radiusKm, page }) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (radiusKm && radiusKm !== DEFAULT_RADIUS_KM) params.set('r', String(radiusKm));
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return `/libraries${query ? `?${query}` : ''}`;
}

export default async function LibrariesPage({ searchParams }) {
    const params = await searchParams;
    const q = readQuery(params.q);
    const radiusKm = readRadiusKm(params.r);
    const page = readPage(params.page);

    return (
        <main className={styles.main}>
            <h1 className={styles.title}>내 주변</h1>

            {/* 검색·반경·페이지 이동을 누르는 즉시 결과 자리를 스켈레톤으로 (PendingNav 설명 참고) */}
            <PendingNavProvider>
                <PendingForm action="/libraries" role="search" className={styles.search}>
                    <SearchField
                        key={q}
                        id="libraries-q"
                        name="q"
                        label="도서관 검색"
                        defaultValue={q}
                        placeholder="도서관 이름"
                        required={false}
                        submitOnClear
                    />
                    {/* 검색해도 고른 반경은 유지 */}
                    {radiusKm !== DEFAULT_RADIUS_KM && <input type="hidden" name="r" value={radiusKm} />}
                </PendingForm>

                {/* 반경 4단계. 링크라 JS 없이 동작하고, 고른 반경은 aria-current로도 알림 */}
                <div className={styles.radius} role="group" aria-label="검색 반경">
                    {RADIUS_STEPS_KM.map((km) => (
                        <PendingLink
                            key={km}
                            href={librariesHref({ q, radiusKm: km })}
                            aria-current={km === radiusKm ? 'true' : undefined}
                            prefetch={false}
                            className={styles.radiusItem}
                        >
                            {formatKm(km)}
                        </PendingLink>
                    ))}
                </div>

                {/* 이동 중에는 바뀔 반경을 아직 모르므로 기준 위치 문구도 자리만 잡음 */}
                <PendingSwap fallback={<ResultsSkeleton />}>
                    <Suspense key={`${q}:${radiusKm}:${page}`} fallback={<ResultsSkeleton radiusKm={radiusKm} />}>
                        <Results q={q} radiusKm={radiusKm} page={page} />
                    </Suspense>
                </PendingSwap>
            </PendingNavProvider>
        </main>
    );
}

async function Results({ q, radiusKm, page }) {
    let data = null;
    try {
        data = await searchLibraries({
            keyword: q || undefined,
            latitude: DEFAULT_BASE.latitude,
            longitude: DEFAULT_BASE.longitude,
            radius: radiusKm * 1000,
            page,
            size: PAGE_SIZE,
        });
    } catch (e) {
        if (!(e instanceof ApiError)) throw e;
    }

    if (!data) {
        return (
            <>
                <p className={styles.base}>{describeBase(radiusKm)}</p>
                <Notice
                    title="도서관 정보를 불러오지 못했어요"
                    action={
                        // 같은 주소를 새로 불러오도록 <a> (JS 없이도 동작)
                        <a href={librariesHref({ q, radiusKm, page })} className={styles.secondary}>
                            다시 시도
                        </a>
                    }
                />
            </>
        );
    }

    const libraries = data.libraries ?? [];
    const totalCount = data.totalCount ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const widen =
        radiusKm < 10 ? (
            <Link href={librariesHref({ q, radiusKm: 10 })} className={styles.secondary}>
                10km까지 넓혀 보기
            </Link>
        ) : null;

    if (totalCount === 0) {
        return (
            <>
                <p className={styles.base}>{describeBase(radiusKm)}</p>
                <Notice
                    title={
                        q
                            ? `${formatKm(radiusKm)} 안에 ‘${q}’ 이름이 들어간 도서관이 없어요`
                            : `${formatKm(radiusKm)} 안에 도서관이 없어요`
                    }
                    action={widen}
                />
            </>
        );
    }

    // 있는 페이지보다 큰 page로 들어온 경우
    if (libraries.length === 0) {
        return (
            <>
                <p className={styles.base}>{describeBase(radiusKm)}</p>
                <Notice
                    title="이 페이지에는 도서관이 없어요"
                    action={
                        <Link href={librariesHref({ q, radiusKm })} className={styles.secondary}>
                            첫 페이지로 가기
                        </Link>
                    }
                />
            </>
        );
    }

    return (
        <>
            <p className={styles.base}>
                {`${describeBase(radiusKm)} · 도서관 ${numberFormat.format(totalCount)}곳`}
            </p>

            <ul className={styles.list}>
                {libraries.map((lib) => (
                    <LibraryRow
                        key={lib.libCode}
                        library={lib}
                        detail={lib.address}
                        badge={
                            <span className={styles.chevron}>
                                <NextIcon size={20} />
                            </span>
                        }
                    />
                ))}
            </ul>

            <Pager
                page={page}
                totalPages={totalPages}
                hrefFor={(p) => librariesHref({ q, radiusKm, page: p })}
                label="도서관 목록 페이지"
            />
        </>
    );
}

function Notice({ title, action }) {
    return (
        <div className={styles.notice}>
            <p className={styles.noticeTitle}>{title}</p>
            {action}
        </div>
    );
}
