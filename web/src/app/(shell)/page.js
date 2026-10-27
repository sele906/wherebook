import { Suspense } from 'react';
import Form from 'next/form';
import Link from 'next/link';

import { ApiError, searchLibraries } from '@/api';
import BrandLogo from '@/components/BrandLogo';
import LibraryRow, { LibraryRowSkeleton } from '@/components/LibraryRow';
import { LoadingArea } from '@/components/Skeleton';
import { SearchIcon, GearIcon, NextIcon, PinIcon, PlusIcon } from '@/components/icons';
import LocationTitle from '@/components/location/LocationTitle';
import OpenLocationButton from '@/components/location/OpenLocationButton';
import { getBase } from '@/lib/base';
import { DEFAULT_RADIUS_KM, baseKey, formatKm } from '@/lib/location';

import styles from './page.module.css';

/*
 * 목업 Main 화면.
 * 실제로 붙는 건 검색 폼(/search?q=)과 내 주변 도서관 카드.
 * 내 주변 도서관: 기준 위치(쿠키)가 있으면 "[핀] 위치 근처 ▾" 제목 + 가까운 도서관 3곳,
 * 기본값이면 "기준 위치 정하기" 빈 상태. 쿠키를 읽으므로 이 화면은 요청마다 렌더링된다.
 *
 * TODO: 가까운 도서관의 운영 상태("운영 중" / "오늘 휴관") — operatingTime·closedDays가 자유 형식 글이라
 *       지금은 계산할 수 없음 (백엔드 정제 필요, /libraries 와 같은 TODO). 그때까지는 거리만.
 * TODO: 최근 검색어 — localStorage에 저장하고 읽어오기 (클라이언트 컴포넌트로 분리 필요)
 * TODO: 인기 대출 — 정보나루 인기대출 엔드포인트가 백엔드에 생기면 교체.
 *       지금은 목업에 있던 샘플 그대로임.
 * TODO: 표지 이미지 — book.imageUrl 붙기 전까지 --surface 색 박스로 둠
 * TODO: 인기 대출 "더보기" — 인기 대출 목록 화면이 생기면 섹션 제목 옆에 링크 추가
 */

const NEARBY_COUNT = 3;
const numberFormat = new Intl.NumberFormat('ko-KR');

const RECENT_KEYWORDS = ['불편한 편의점', '세이노의 가르침', '한강'];

const POPULAR_BOOKS = [
    { title: '소년이 온다', authors: '한강' },
    { title: '불편한 편의점', authors: '김호연' },
    { title: '채식주의자', authors: '한강' },
    { title: '작별하지 않는다', authors: '한강' },
    { title: '세이노의 가르침', authors: '세이노' },
    { title: '흰', authors: '한강' },
];

export default async function Home() {
    const base = await getBase();

    return (
        <main className={styles.main}>
            {/* 모바일·태블릿 헤더. 1024px 이상에서는 SiteHeader가 대신함 */}
            <header className={styles.mobileHeader}>
                <BrandLogo size={28} />
                <span className={styles.wordmark}>책어디</span>
                <Link href="/settings" className={styles.iconLink} aria-label="설정">
                    <GearIcon size={22} />
                </Link>
            </header>

            <section className={styles.hero}>
                <h1 className={styles.headline}>
                    빌리고 싶은 책,
                    <br />
                    어느 도서관에 있을까?
                </h1>

                {/* next/form: 제출하면 새로고침 없이 이동 (JS 없으면 일반 GET 폼) */}
                <Form action="/search" role="search" className={styles.searchForm}>
                    <label htmlFor="home-q" className="sr-only">
                        책 검색
                    </label>
                    {/* 지우기(✕) 버튼은 일부러 없음 — 메인은 빈 검색창에서 시작하고, 검색 버튼 옆이 복잡해짐 */}
                    <div className={styles.searchBar}>
                        <SearchIcon size={20} />
                        <input
                            id="home-q"
                            name="q"
                            type="search"
                            placeholder="책 제목"
                            enterKeyHint="search"
                            className={styles.searchInput}
                        />
                        {/* 모바일은 아이콘만, 768px 이상은 "검색" 글자 버튼 (목업 그대로) */}
                        <button type="submit" className={styles.searchButton} aria-label="검색">
                            <SearchIcon size={20} strokeWidth={2.2} />
                            <span className={styles.searchButtonLabel} aria-hidden="true">
                                검색
                            </span>
                        </button>
                    </div>
                </Form>
            </section>

            {base.isDefault ? (
                <section className={styles.nearby} aria-labelledby="nearby-heading">
                    <h2 id="nearby-heading" className={styles.nearbyTitle}>
                        내 주변 도서관
                    </h2>
                    <p className={styles.nearbyText}>
                        집이나 회사처럼 자주 가는 곳을 기준으로 정하면 가까운 도서관부터 보여드려요.
                    </p>
                    {/* GPS 대신 주소 검색으로 고른 위치를 쓴다 (lib/location.js 설명) */}
                    <OpenLocationButton className={styles.locateButton}>
                        <PinIcon size={18} />
                        기준 위치 정하기
                    </OpenLocationButton>
                </section>
            ) : (
                <section className={`${styles.nearby} ${styles.nearbySet}`} aria-labelledby="nearby-heading">
                    {/* 보이는 제목은 위치 버튼. 제목 구조용 h2는 화면에서 숨김 */}
                    <h2 id="nearby-heading" className="sr-only">
                        내 주변 도서관
                    </h2>
                    {/* 도서관 목록은 늦게 와도 됨 — 검색창부터 먼저 보여준다 */}
                    <Suspense key={baseKey(base)} fallback={<NearbySkeleton base={base} />}>
                        <NearbyLibraries base={base} />
                    </Suspense>
                </section>
            )}

            <section className={styles.recent} aria-labelledby="recent-heading">
                <div className={styles.sectionHead}>
                    <h2 id="recent-heading" className={styles.sectionTitle}>
                        최근 검색어
                    </h2>
                    <button type="button" className={styles.textButton}>
                        전체 삭제
                    </button>
                </div>
                <div className={styles.chips}>
                    {RECENT_KEYWORDS.map((keyword) => (
                        <Link
                            key={keyword}
                            href={`/search?q=${encodeURIComponent(keyword)}`}
                            className={styles.chip}
                        >
                            <span className={styles.chipLabel}>{keyword}</span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className={styles.popular} aria-labelledby="popular-heading">
                <div className={styles.sectionHead}>
                    <h2 id="popular-heading" className={styles.sectionTitle}>
                        이번 주 인기 대출
                    </h2>
                </div>
                <ul className={styles.bookRow}>
                    {POPULAR_BOOKS.map((book) => (
                        <li key={book.title} className={styles.bookCard}>
                            <div className={styles.cover}>
                                {/* TODO: 빌릴 책에 추가 → 빌릴 책 API(/api/borrow-list) 붙일 때 연결 */}
                                <button
                                    type="button"
                                    className={styles.addButton}
                                    aria-label={`${book.title} 빌릴 책에 추가`}
                                >
                                    <PlusIcon size={20} strokeWidth={2.2} />
                                </button>
                            </div>
                            <span className={styles.bookTitle}>{book.title}</span>
                            <span className={styles.bookAuthors}>{book.authors}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    );
}

// 카드 머리: [핀] 위치 근처 ▾ (고르기 창 열기) + "N곳 모두 보기"
function NearbyHead({ base, more }) {
    return (
        <div className={styles.nearbyHead}>
            <LocationTitle base={base} text={`${base.label} 근처`} />
            {more}
        </div>
    );
}

function NearbySkeleton({ base }) {
    return (
        <>
            <NearbyHead base={base} />
            <LoadingArea label="가까운 도서관을 찾고 있어요">
                <ul className={styles.nearbyList}>
                    {Array.from({ length: NEARBY_COUNT }, (_, i) => (
                        <LibraryRowSkeleton key={i} />
                    ))}
                </ul>
            </LoadingArea>
        </>
    );
}

async function NearbyLibraries({ base }) {
    let data = null;
    try {
        data = await searchLibraries({
            latitude: base.latitude,
            longitude: base.longitude,
            radius: DEFAULT_RADIUS_KM * 1000,
            page: 1,
            size: NEARBY_COUNT,
        });
    } catch (e) {
        if (!(e instanceof ApiError)) throw e;
    }

    if (!data) {
        return (
            <>
                <NearbyHead base={base} />
                <p className={styles.nearbyText}>도서관 정보를 불러오지 못했어요.</p>
                {/* 같은 주소로 이동하면 서버 화면을 새로 받아옴 (JS 없으면 일반 링크로 새로고침) */}
                <Link href="/" prefetch={false} className={styles.nearbyAction}>
                    다시 시도
                </Link>
            </>
        );
    }

    const libraries = data.libraries ?? [];
    const totalCount = data.totalCount ?? 0;

    if (libraries.length === 0) {
        return (
            <>
                <NearbyHead base={base} />
                <p className={styles.nearbyText}>{`${formatKm(DEFAULT_RADIUS_KM)} 안에 도서관이 없어요.`}</p>
                <Link href="/libraries?r=10" className={styles.nearbyAction}>
                    10km까지 넓혀 보기
                </Link>
            </>
        );
    }

    return (
        <>
            <NearbyHead
                base={base}
                more={
                    <Link href={`/libraries?r=${DEFAULT_RADIUS_KM}`} className={styles.moreLink}>
                        {`${numberFormat.format(totalCount)}곳 모두 보기`}
                    </Link>
                }
            />
            <ul className={styles.nearbyList}>
                {libraries.map((lib) => (
                    <LibraryRow
                        key={lib.libCode}
                        library={lib}
                        badge={
                            <span className={styles.chevron}>
                                <NextIcon size={18} />
                            </span>
                        }
                    />
                ))}
            </ul>
        </>
    );
}
