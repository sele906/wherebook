import { cache, Suspense } from 'react';
import Link from 'next/link';

import { ApiError, searchLibraries } from '@/api';
import LibraryRow from '@/components/LibraryRow';
import Pager, { readPage } from '@/components/Pager';
import { PendingForm, PendingLink, PendingNavProvider, PendingSwap } from '@/components/PendingNav';
import SearchField from '@/components/SearchField';
import { NextIcon } from '@/components/icons';
import LibraryMapSkeleton from '@/components/map/LibraryMapSkeleton';
import { getBase } from '@/lib/base';
import {
    DEFAULT_RADIUS_KM,
    baseKey,
    describeBase,
    RADIUS_STEPS_KM,
    formatKm,
    readRadiusKm,
} from '@/lib/location';

import NearbyView, { MapPane, MapSheet } from './NearbyView';
import ResultsSkeleton from './ResultsSkeleton';
import TitleRow from './TitleRow';
import styles from './page.module.css';

/*
 * 내 주변 도서관 목록 — /libraries?q=도서관이름&r=3&page=2
 * 기준 위치에서 반경 안의 도서관을 거리순으로. 검색어도 반경 안에서만 찾는다.
 * 보는 사람 위치에 따라 내용이 바뀌는 화면이라 noindex (링크는 따라가게 follow).
 *
 * 기준 위치는 쿠키(getBase). 화면 제목 "[핀] 위치 이름 ▾"이 기준을 글자로 보여주고, 누르면 바꾼다.
 * 목록 / 지도: 모바일은 제목 옆 토글로 오가고, 웹은 왼쪽 패널(목록) + 오른쪽 지도 (NearbyView).
 *   지도와 목록은 같은 API 응답을 공유 (loadLibraries를 React cache로 한 번만 부름).
 * TODO: 지도 위 요소 — 반경 원, 대출 상태 핀, 목록과 선택 상태 공유, "이 지역에서 다시 검색" (DESIGN.md 지도)
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

// 목록(Results)과 지도(MapSection)가 같은 응답을 쓰도록 한 요청 안에서 한 번만 부른다 (React cache).
// 실패하면 null
const loadLibraries = cache(async (latitude, longitude, q, radiusKm, page) => {
    try {
        return await searchLibraries({
            keyword: q || undefined,
            latitude,
            longitude,
            radius: radiusKm * 1000,
            page,
            size: PAGE_SIZE,
        });
    } catch (e) {
        if (e instanceof ApiError) return null;
        throw e;
    }
});

export default async function LibrariesPage({ searchParams }) {
    const params = await searchParams;
    const q = readQuery(params.q);
    const radiusKm = readRadiusKm(params.r);
    const page = readPage(params.page);
    const base = await getBase();
    const resultsKey = `${q}:${radiusKm}:${page}:${baseKey(base)}`;

    return (
        <NearbyView className={styles.main}>
            {/* 검색·반경·페이지 이동을 누르는 즉시 결과 자리를 스켈레톤으로 (PendingNav 설명 참고) */}
            <PendingNavProvider>
                {/* 왼쪽 패널(웹) / 화면 위쪽(모바일): 제목·검색·반경·목록 */}
                <div className={styles.panel}>
                    <TitleRow base={base} />

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

                    <RadiusLinks q={q} radiusKm={radiusKm} className={styles.radius} />

                    {/* 모바일 지도 보기에서는 CSS로 숨김 */}
                    <div className={styles.results}>
                        <PendingSwap fallback={<ResultsSkeleton />}>
                            <Suspense key={resultsKey} fallback={<ResultsSkeleton />}>
                                <Results base={base} q={q} radiusKm={radiusKm} page={page} />
                            </Suspense>
                        </PendingSwap>
                    </div>
                </div>

                {/* 지도 칸: 모바일은 지도 보기일 때만, 웹은 항상 오른쪽에 */}
                <section className={styles.mapPane} aria-label="지도">
                    {/* TODO: 지도 디자인 단계에서 모바일 지도 위에 기준 위치·반경 띄우기 (목업) */}
                    <PendingSwap fallback={<LibraryMapSkeleton />}>
                        <Suspense key={resultsKey} fallback={<LibraryMapSkeleton />}>
                            <MapSection base={base} q={q} radiusKm={radiusKm} page={page} />
                        </Suspense>
                    </PendingSwap>
                </section>
            </PendingNavProvider>
        </NearbyView>
    );
}

// 반경 4단계. 링크라 JS 없이 동작하고, 고른 반경은 aria-current로도 알림. 패널과 모바일 지도 위에서 같이 씀
function RadiusLinks({ q, radiusKm, className }) {
    return (
        <div className={className} role="group" aria-label="검색 반경">
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
    );
}

// 지도 + 모바일 바텀시트. 목록(Results)과 같은 응답 (loadLibraries cache)
async function MapSection({ base, q, radiusKm, page }) {
    const data = await loadLibraries(base.latitude, base.longitude, q, radiusKm, page);
    const libraries = data?.libraries ?? [];
    const totalCount = data?.totalCount ?? 0;

    let title;
    let body = null;
    if (!data) {
        title = '도서관 정보를 불러오지 못했어요';
        body = (
            <div className={styles.sheetAction}>
                <a href={librariesHref({ q, radiusKm, page })} className={styles.secondary}>
                    다시 시도
                </a>
            </div>
        );
    } else if (libraries.length === 0) {
        title = `${formatKm(radiusKm)} 안에 도서관이 없어요`;
    } else {
        title = `도서관 ${numberFormat.format(totalCount)}곳`;
        body = (
            <ul className={styles.list}>
                {libraries.map((lib) => (
                    <LibraryRow
                        key={lib.libCode}
                        library={lib}
                        badge={
                            <span className={styles.chevron}>
                                <NextIcon size={20} />
                            </span>
                        }
                    />
                ))}
            </ul>
        );
    }

    return (
        <>
            {/* 불러오지 못했으면 기준 위치만 있는 지도 */}
            <MapPane base={base} libraries={libraries} radiusKm={radiusKm} />
            {/* TODO: 20곳 넘으면 시트에도 다음 페이지 — 지금은 목록 보기에서 페이지를 넘김 */}
            <MapSheet title={title} summary={describeBase(base, radiusKm)}>
                {body}
            </MapSheet>
        </>
    );
}

async function Results({ base, q, radiusKm, page }) {
    const data = await loadLibraries(base.latitude, base.longitude, q, radiusKm, page);

    if (!data) {
        return (
            <Notice
                title="도서관 정보를 불러오지 못했어요"
                action={
                    // 같은 주소를 새로 불러오도록 <a> (JS 없이도 동작)
                    <a href={librariesHref({ q, radiusKm, page })} className={styles.secondary}>
                        다시 시도
                    </a>
                }
            />
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
            <Notice
                title={
                    q
                        ? `${formatKm(radiusKm)} 안에 ‘${q}’ 이름이 들어간 도서관이 없어요`
                        : `${formatKm(radiusKm)} 안에 도서관이 없어요`
                }
                action={widen}
            />
        );
    }

    // 있는 페이지보다 큰 page로 들어온 경우
    if (libraries.length === 0) {
        return (
            <Notice
                title="이 페이지에는 도서관이 없어요"
                action={
                    <Link href={librariesHref({ q, radiusKm })} className={styles.secondary}>
                        첫 페이지로 가기
                    </Link>
                }
            />
        );
    }

    return (
        <>
            {/* 기준 위치는 제목에 있으니 반경과 개수만. 숫자 자리가 있는 한 문장 */}
            <p className={styles.base}>
                {formatKm(radiusKm)} 안에 도서관{' '}
                <strong className={styles.count}>{numberFormat.format(totalCount)}</strong>곳
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
