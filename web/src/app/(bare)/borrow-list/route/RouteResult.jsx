import Link from 'next/link';

import { PendingLink } from '@/components/PendingNav';
import { formatDistance, formatKm } from '@/lib/location';

import BookLine from './BookLine';
import MissingBooks from './MissingBooks';
import PlanCard, { StaticPlanCard } from './PlanCard';
import RouteDirections from './RouteDirections';
import { loadRoute } from './loadRoute';
import { bookMeta, shortTitle } from './routeBooks';
import styles from './page.module.css';

/*
 * 동선 결과 (디자인 chaekeodi-route.html). 지도·헤더 부제와 같은 응답 (loadRoute cache).
 *   A안 "N권 다 빌리기" — 반경 안에서 대출 가능한 책을 다 빌리는 방문 순서 (최대 3곳)
 *   B안 "한 곳만 가기"  — 대출 가능한 책이 가장 많은 한 곳. A안이 1곳이면 같은 말이라 숨김
 *   못 빌리는 책 한 줄 — 펼치면 책마다 "대출중" / "근처에 없어요"
 *   Primary "지도 앱으로 길찾기" — 기준 위치에서 고른 안의 도서관들을 순서대로
 * 안이 둘이면 카드를 눌러 고르고(PlanCard), 하나뿐이면 선택된 모양의 일반 카드.
 *
 * TODO: 도서관당 대출 한도(기본 14권) 반영 — 백엔드 동선 계산에서 (CLAUDE.md)
 */

const countFormat = new Intl.NumberFormat('ko-KR');

// "소년이 온다 창비 2014 · 채식주의자 창비 2007" — 한 줄 안에 여러 권을 이어 쓸 때
function bookTexts(books) {
    return books.map((book) => [shortTitle(book), bookMeta(book)].filter(Boolean).join(' ')).join(' · ');
}

// 1km 미만은 m(10m 단위), 그 이상은 km
function distanceText(km) {
    return formatDistance(km * 1000);
}

export default async function RouteResult({ base, isbnKey, radiusKm, retryHref, widenHref, widenKm }) {
    const data = await loadRoute(isbnKey, base.latitude, base.longitude, radiusKm);

    if (!data) {
        return (
            <div className={styles.result}>
                <Notice
                    title="동선을 계산하지 못했어요"
                    action={
                        // 같은 주소를 새로 불러오도록 <a> (JS 없이도 동작)
                        <a href={retryHref} className={styles.secondary}>
                            다시 시도
                        </a>
                    }
                />
            </div>
        );
    }

    const route = data.allAvailableBooksRoute;
    const onLoan = data.onLoanNearby ?? [];
    const notFound = data.notFoundNearby ?? [];
    // A안이 1곳뿐이면 B안과 같은 말이라 숨김
    const single = route?.stops.length === 1 ? null : data.bestSingleLibrary;
    const choosable = Boolean(route && single);

    // 길찾기에 넘길 도서관 좌표 (방문 순서대로)
    const directionStops = {
        all: route ? route.stops.map(toPoint) : null,
        single: single ? [toPoint(single)] : null,
    };

    return (
        <div className={styles.result}>
            {!route && !single && (
                <Notice title={`${formatKm(radiusKm)} 안에서 지금 빌릴 수 있는 책이 없어요`} />
            )}

            {route && (
                <Card value="all" choosable={choosable}>
                    <AllBooksPlan route={route} />
                </Card>
            )}
            {single && (
                <Card value="single" choosable={choosable}>
                    <SinglePlan single={single} onLoan={onLoan} notFound={notFound} />
                </Card>
            )}

            {(onLoan.length > 0 || notFound.length > 0) && (
                <MissingBooks
                    summary={
                        <>
                            <strong>{countFormat.format(onLoan.length + notFound.length)}권</strong>은{' '}
                            {formatKm(radiusKm)} 안에서 못 빌려요
                        </>
                    }
                    widen={
                        widenHref && (
                            <PendingLink href={widenHref} prefetch={false} className={styles.widen}>
                                반경 넓히기
                                <span className="sr-only">({formatKm(widenKm)}로)</span>
                            </PendingLink>
                        )
                    }
                >
                    <ul className={styles.missingList}>
                        {onLoan.map((book) => (
                            <MissingRow key={book.isbn13} book={book} onLoan />
                        ))}
                        {notFound.map((book) => (
                            <MissingRow key={book.isbn13} book={book} />
                        ))}
                    </ul>
                </MissingBooks>
            )}

            <RouteDirections origin={toPoint(base)} stops={directionStops} />
        </div>
    );
}

function toPoint({ latitude, longitude }) {
    return { latitude, longitude };
}

function Card({ value, choosable, children }) {
    return choosable ? <PlanCard value={value}>{children}</PlanCard> : <StaticPlanCard>{children}</StaticPlanCard>;
}

// 카드 안은 버튼일 수 있어서 span만 쓴다 (PlanCard 설명)
function AllBooksPlan({ route }) {
    return (
        <>
            <span className={styles.cardHead}>
                <span className={styles.cardTitle}>{`${countFormat.format(route.borrowableBookCount)}권 다 빌리기`}</span>
                <span className={styles.cardMeta}>
                    {`${countFormat.format(route.stops.length)}곳 · ${distanceText(route.totalKm)}`}
                </span>
            </span>

            {route.stops.map((stop) => (
                <span key={stop.libCode} className={styles.stop}>
                    <span className={styles.stopNo}>
                        {stop.order}
                        <span className="sr-only">번째</span>
                    </span>
                    <span className={styles.stopText}>
                        <span className={styles.stopName}>{stop.libName}</span>
                        {/* 이 도서관에서 빌릴 책만 한 줄씩 */}
                        {stop.books.map((book) => (
                            <BookLine key={book.isbn13} book={book} />
                        ))}
                    </span>
                </span>
            ))}
        </>
    );
}

function SinglePlan({ single, onLoan, notFound }) {
    // 빠지는 책 = 이 도서관엔 없지만 다른 도서관에선 빌릴 수 있는 책.
    // 반경 안에서 아예 못 빌리는 책(대출중·근처에 없음)은 아래 "못 빌리는 책" 줄에서 따로 보여줌
    const elsewhere = new Set([...onLoan, ...notFound].map((book) => book.isbn13));
    const missing = (single.unavailableBooks ?? []).filter((book) => !elsewhere.has(book.isbn13));

    return (
        <>
            <span className={styles.cardHead}>
                <span className={styles.cardTitle}>한 곳만 가기</span>
                <span className={styles.cardMeta}>{`1곳 · ${distanceText(single.distanceKm)}`}</span>
            </span>
            <span className={styles.singleText}>
                {`${single.libName}에서 ${countFormat.format(single.books.length)}권`}
            </span>
            {missing.length > 0 && (
                // 조사(은/는)가 책 제목에 따라 달라져서 "빠지는 책:" 꼴로
                <span className={styles.singleMissing}>빠지는 책: {bookTexts(missing)}</span>
            )}
        </>
    );
}

// 한 행 전체가 책 상세 링크 (반경 밖 소장 도서관은 상세에서 볼 수 있음).
// 상태는 글자로 — 대출중은 배지, 근처에 없음은 보조 글자 (색만으로 구분하지 않음)
function MissingRow({ book, onLoan = false }) {
    return (
        <li>
            <Link href={`/book/${book.isbn13}`} className={styles.missingRow}>
                <BookLine book={book} />
                {onLoan ? (
                    <span className={styles.onLoanBadge}>대출중</span>
                ) : (
                    <span className={styles.missingMeta}>근처에 없어요</span>
                )}
            </Link>
        </li>
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
