import { cache, Suspense } from 'react';
import Link from 'next/link';

import { ApiError, searchLibraries, searchLibraryPins } from '@/api';
import { readPage } from '@/components/Pager';
import { PendingForm, PendingLink, PendingNavProvider, PendingSwap } from '@/components/PendingNav';
import SearchField from '@/components/SearchField';
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

import LibraryList from './LibraryList';
import MoreLink from './MoreLink';
import NearbyView, { MapPane, MapSheet } from './NearbyView';
import ResultsSkeleton from './ResultsSkeleton';
import TitleRow from './TitleRow';
import styles from './page.module.css';

/*
 * 내 주변 도서관 목록 — /libraries?q=도서관이름&r=3&page=2
 * 기준 위치에서 반경 안의 도서관을 거리순으로. 검색어도 반경 안에서만 찾는다.
 * page=N은 "1~N페이지까지 보기" — 목록 아래 "더 보기"가 N+1로 가는 링크 (웹·모바일 같음).
 *   서버가 지금까지 본 도서관을 다 그려서 HTML에 남고 JS 없이도 동작한다 (무한 스크롤 대신).
 * 보는 사람 위치에 따라 내용이 바뀌는 화면이라 noindex (링크는 따라가게 follow).
 *
 * 기준 위치는 쿠키(getBase). 화면 제목 "[핀] 위치 이름 ▾"이 기준을 글자로 보여주고, 누르면 바꾼다.
 * 목록 / 지도: 모바일은 제목 옆 토글로 오가고, 웹은 왼쪽 패널(목록) + 오른쪽 지도 (NearbyView).
 *   목록은 페이지별(loadLibraries, 20곳), 지도는 반경 안 전부(loadPins, 핀 API). 둘 다 페이지를 그릴 때 한 번만 부르고
 *   (React cache) 목록 ↔ 지도를 오갈 때 다시 부르지 않는다.
 *   고른 도서관도 공유: 목록 행에 올리거나 포커스하면 핀이 커지고, 핀을 누르면 행이 강조된다 (LibraryList).
 * TODO: 지도 위 요소 — 반경 원, 대출 상태 핀, "이 지역에서 다시 검색" (DESIGN.md 지도)
 * TODO: 운영 상태("운영 중 · 22시까지" / "오늘 휴관") — 운영시간·휴관일 데이터 정제 필요.
 *       지금 operatingTime·closedDays는 자유 형식 글이라 계산할 수 없음 (백엔드 작업).
 * TODO: 지역별 도서관 목록 (색인용) — /libraries/region/[regionCode](/[dtlRegionCode]) 를 따로 만들어
 *       index 대상으로. 위치와 상관없이 주소마다 내용이 고정된 페이지가 검색엔진 입구가 됨.
 * TODO: 정렬 — 백엔드가 거리순만 지원. 다른 정렬이 생기면 결과 수 옆에 추가.
 */

const PAGE_SIZE = 20;
// 백엔드가 한 번에 주는 최대 수. "더 보기"로 늘어난 목록은 이 단위로 나눠 동시에 받는다
const CHUNK_SIZE = 50;
// 주소를 바꿔 끝없이 불러오지 않게 (500곳 = 요청 10번)
const MAX_PAGES = 25;
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
    // 반경은 기본값(3km)이어도 항상 주소에 적는다
    params.set('r', String(radiusKm || DEFAULT_RADIUS_KM));
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return `/libraries${query ? `?${query}` : ''}`;
}

// 1~pages페이지 목록 (가까운 순 pages × 20곳). 패널(Results)과 바텀시트(MapSection)가 같이 쓰도록
// 한 요청 안에서 한 번만 부른다 (React cache). 실패하면 null
const loadLibraries = cache(async (latitude, longitude, q, radiusKm, pages) => {
    const wanted = pages * PAGE_SIZE;
    const size = Math.min(wanted, CHUNK_SIZE);
    try {
        const chunks = await Promise.all(
            Array.from({ length: Math.ceil(wanted / size) }, (_, i) =>
                searchLibraries({
                    keyword: q || undefined,
                    latitude,
                    longitude,
                    radius: radiusKm * 1000,
                    page: i + 1,
                    size,
                })
            )
        );
        return {
            libraries: chunks.flatMap((chunk) => chunk.libraries ?? []).slice(0, wanted),
            totalCount: chunks[0].totalCount ?? 0,
        };
    } catch (e) {
        if (e instanceof ApiError) return null;
        throw e;
    }
});

// 지도 핀: 같은 조건에서 페이지 없이 반경 안 전부 (가까운 순 최대 500곳). 목록 페이지와 상관없음. 실패하면 null
const loadPins = cache(async (latitude, longitude, q, radiusKm) => {
    try {
        return await searchLibraryPins({
            keyword: q || undefined,
            latitude,
            longitude,
            radius: radiusKm * 1000,
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
    const page = Math.min(readPage(params.page), MAX_PAGES);
    const base = await getBase();
    // page는 넣지 않는다: "더 보기"로 page만 바뀔 때 목록·시트가 스켈레톤으로 바뀌지 않고 그대로 있다가 늘어나게
    // (시트를 펼친 상태도 유지). 검색어·반경·기준 위치가 바뀌면 새로 그린다
    const resultsKey = `${q}:${radiusKm}:${baseKey(base)}`;

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
                        <input type="hidden" name="r" value={radiusKm} />
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

// 지도 + 모바일 바텀시트. 시트 목록은 Results와 같은 응답(loadLibraries cache), 지도는 핀 API(loadPins)
async function MapSection({ base, q, radiusKm, page }) {
    const [data, pinData] = await Promise.all([
        loadLibraries(base.latitude, base.longitude, q, radiusKm, page),
        loadPins(base.latitude, base.longitude, q, radiusKm),
    ]);
    const libraries = data?.libraries ?? [];
    const totalCount = data?.totalCount ?? 0;
    // 지도: 핀 API(반경 안 전부). 실패하면 목록의 이 페이지 도서관으로.
    // 지도는 클라이언트로 넘어가서 HTML에 실리므로 핀에 필요한 값만
    const pins = (pinData?.libraries ?? libraries).map(({ libCode, name, latitude, longitude }) => ({
        libCode,
        name,
        latitude,
        longitude,
    }));
    const pinTotal = pinData ? pinData.totalCount : totalCount;

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
        // 패널과 같은 "더 보기". 클라이언트 이동이라 지도 보기·펼친 시트가 유지된다 (지도는 페이지와 상관없이 반경 안 전부)
        body = (
            <>
                <LibraryList libraries={libraries} anchorIndex={(page - 1) * PAGE_SIZE} anchorId="sheet-more" />
                <More
                    shown={libraries.length}
                    totalCount={totalCount}
                    href={`${librariesHref({ q, radiusKm, page: page + 1 })}#sheet-more`}
                />
            </>
        );
    }

    return (
        <>
            {/* 불러오지 못했으면 기준 위치만 있는 지도 */}
            <MapPane base={base} libraries={pins} radiusKm={radiusKm} totalCount={pinTotal} />
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

    return (
        <>
            {/* 기준 위치는 제목에 있으니 반경과 개수만. 숫자 자리가 있는 한 문장 */}
            <p className={styles.base}>
                {formatKm(radiusKm)} 안에 도서관{' '}
                <strong className={styles.count}>{numberFormat.format(totalCount)}</strong>곳
            </p>

            <LibraryList
                libraries={libraries}
                withAddress
                anchorIndex={(page - 1) * PAGE_SIZE}
                anchorId="libraries-more"
            />

            <More
                shown={libraries.length}
                totalCount={totalCount}
                href={`${librariesHref({ q, radiusKm, page: page + 1 })}#libraries-more`}
            />
        </>
    );
}

// "N곳 중 M곳을 보고 있어요" + 더 보기. 다 봤으면(또는 더 불러올 수 없으면) 그리지 않는다
function More({ shown, totalCount, href }) {
    if (shown >= totalCount || shown >= MAX_PAGES * PAGE_SIZE) return null;
    return (
        <div className={styles.more}>
            <p className={styles.moreText}>
                {`${numberFormat.format(totalCount)}곳 중 ${numberFormat.format(shown)}곳을 보고 있어요`}
            </p>
            <MoreLink href={href} className={`${styles.secondary} ${styles.moreLink}`} />
        </div>
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
