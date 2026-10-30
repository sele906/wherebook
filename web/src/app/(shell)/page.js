import { Suspense } from 'react';
import Link from 'next/link';

import { ApiError, getPopularBooks, searchLibraries } from '@/api';
import AddToBorrowListButton from '@/components/AddToBorrowListButton';
import BrandLogo from '@/components/BrandLogo';
import LibraryRow, { LibraryRowSkeleton } from '@/components/LibraryRow';
import { LoadingArea, Skeleton } from '@/components/Skeleton';
import RecentSearchForm from '@/components/RecentSearchForm';
import { SearchIcon, GearIcon, NextIcon, PinIcon } from '@/components/icons';
import LocationTitle from '@/components/location/LocationTitle';
import OpenLocationButton from '@/components/location/OpenLocationButton';
import { getBase } from '@/lib/base';
import { getMyBorrowList } from '@/lib/borrowList';
import { DEFAULT_RADIUS_KM, baseKey, formatKm } from '@/lib/location';
import { toHttps } from '@/lib/url';

import RecentSearches from './RecentSearches';
import styles from './page.module.css';

/*
 * 목업 Main 화면.
 * 실제로 붙는 건 검색 폼(/search?q=), 최근 검색어(localStorage), 내 주변 도서관 카드, 이번 주 인기 대출.
 * 내 주변 도서관: 기준 위치(쿠키)가 있으면 "[핀] 위치 근처 ▾" 제목 + 가까운 도서관 3곳,
 * 기본값이면 "기준 위치 정하기" 빈 상태. 쿠키를 읽으므로 이 화면은 요청마다 렌더링된다.
 * 인기 대출: /api/books/popular 앞 6권. 늦게 와도 되므로 Suspense로 나중에 채운다.
 *
 * TODO: 가까운 도서관의 운영 상태("운영 중" / "오늘 휴관") — operatingTime·closedDays가 자유 형식 글이라
 *       지금은 계산할 수 없음 (백엔드 정제 필요, /libraries 와 같은 TODO). 그때까지는 거리만.
 * TODO: 인기 대출 "더보기" — 인기 대출 목록 화면이 생기면 섹션 제목 옆에 링크 추가
 */

const NEARBY_COUNT = 3;
const POPULAR_COUNT = 6;
const numberFormat = new Intl.NumberFormat('ko-KR');

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

                {/* next/form: 제출하면 최근 검색어에 저장하고 새로고침 없이 이동 (JS 없으면 일반 GET 폼) */}
                <RecentSearchForm action="/search" role="search" className={styles.searchForm}>
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
                </RecentSearchForm>
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

            {/* 검색어가 없으면 섹션째 안 그림 (브라우저 저장소라 하이드레이션 뒤에 나타남) */}
            <RecentSearches inputId="home-q" />

            <section className={styles.popular} aria-labelledby="popular-heading">
                <div className={styles.sectionHead}>
                    <h2 id="popular-heading" className={styles.sectionTitle}>
                        이번 주 인기 대출
                    </h2>
                </div>
                <Suspense fallback={<PopularSkeleton />}>
                    <PopularBooks />
                </Suspense>
            </section>
        </main>
    );
}

function PopularSkeleton() {
    return (
        // 로딩 알림(label)은 한 화면에 한 곳만 — 내 주변 도서관 쪽이 맡음
        <LoadingArea>
            <ul className={styles.bookRow}>
                {Array.from({ length: POPULAR_COUNT }, (_, i) => (
                    <li key={i} className={styles.bookCard}>
                        <span className={styles.cover} />
                        <Skeleton width="80%" />
                        <Skeleton width="50%" height="var(--text-sm)" />
                    </li>
                ))}
            </ul>
        </LoadingArea>
    );
}

async function PopularBooks() {
    // 빌릴 책 목록도 같이 받아서 이미 담긴 책은 처음부터 "추가됨"으로 (실패하면 null → 전부 "추가" 모양)
    const [data, borrowList] = await Promise.all([
        getPopularBooks({ pageSize: POPULAR_COUNT }).catch((e) => {
            if (e instanceof ApiError) return null;
            throw e;
        }),
        getMyBorrowList(),
    ]);
    const addedIsbns = new Set((borrowList ?? []).map((item) => item.isbn13));

    if (!data) {
        return (
            <div className={styles.popularMessage}>
                <p className={styles.nearbyText}>인기 대출 도서를 불러오지 못했어요.</p>
                <Link href="/" prefetch={false} className={styles.nearbyAction}>
                    다시 시도
                </Link>
            </div>
        );
    }

    const books = (data.books ?? []).slice(0, POPULAR_COUNT);

    if (books.length === 0) {
        return (
            <div className={styles.popularMessage}>
                <p className={styles.nearbyText}>이번 주 인기 대출 기록이 아직 없어요.</p>
            </div>
        );
    }

    return (
        <ul className={styles.bookRow}>
            {books.map((book) => {
                const cover = toHttps(book.imageUrl);
                const href = `/book/${book.isbn13}`;
                return (
                    <li key={book.isbn13} className={styles.bookCard}>
                        {/* 표지와 제목이 같은 책 상세로 감. 추가 버튼은 링크 밖에 두려고 표지 링크를 따로 둠 (Tab·스크린리더엔 제목 링크 하나만) */}
                        <div className={styles.coverWrap}>
                            <Link href={href} className={styles.cover} tabIndex={-1} aria-hidden="true">
                                {cover && (
                                    // 표지는 여러 외부 호스트라 next/image 대신 img로 지연 로딩만 함. 자리는 .cover가 5:7로 잡음
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={cover} alt="" loading="lazy" decoding="async" />
                                )}
                            </Link>
                            <AddToBorrowListButton
                                isbn13={book.isbn13}
                                title={book.title}
                                initialAdded={addedIsbns.has(book.isbn13)}
                                compact
                                className={styles.addButton}
                                errorClassName={styles.addError}
                            />
                        </div>
                        <Link href={href} className={styles.bookLink}>
                            <span className={styles.bookTitle}>{book.title}</span>
                            {book.authors && <span className={styles.bookAuthors}>{book.authors}</span>}
                        </Link>
                    </li>
                );
            })}
        </ul>
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
