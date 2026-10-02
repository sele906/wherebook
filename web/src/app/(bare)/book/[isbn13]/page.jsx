import { Suspense } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { userAgentFromString } from 'next/server';

import { ApiError, getBook, getLoanStatuses, LOAN_BATCH_SIZE, searchLibrariesByBook } from '@/api';
import BackLink from '@/components/BackLink';
import { LibraryRowSkeleton } from '@/components/LibraryRow';
import LoanBadge, { LoanBadgeSkeleton } from '@/components/LoanBadge';
import { LoadingArea } from '@/components/Skeleton';
import { PlusIcon } from '@/components/icons';
import { isValidIsbn13 } from '@/lib/ids';
import { DEFAULT_BASE, describeBase, formatKm, readRadiusKm } from '@/lib/location';
import { toHttps } from '@/lib/url';

import HoldingRow from './HoldingRow';
import MoreLibraries from './MoreLibraries';
import styles from './page.module.css';

/*
 * 책 상세 — /book/{isbn13}  (색인 대상)
 * 책 정보(제목·저자·소장 도서관)는 서버에서 HTML로 그린다.
 * 소장 도서관은 LOAN_BATCH_SIZE(6)곳씩 나눠 보여준다.
 *   - 첫 묶음: 서버에서 그림. 목록이 먼저 뜨고, 6곳의 대출 배지는 한 번에 조회해서 함께 채움.
 *   - 다음 묶음: "더 보기"(MoreLibraries)를 누르면 6곳씩 붙이고 그 6곳만 조회.
 * 도서관 행을 누르면 펼쳐지면서 그 도서관 하나의 청구기호를 조회해 보여준다 (HoldingRow).
 * 봇(검색엔진 크롤러)에게는 대출 여부를 조회하지 않는다 (정보나루 호출량 보호).
 *
 * 쿼리: r = 반경 km (1·3·5·10)
 *
 * TODO: 기준 위치 — 위치 입력 UI가 생기면 쿠키의 기준 위치를 쓴다. 지금은 DEFAULT_BASE(서울 시청).
 * TODO: "지도에서 보기" 버튼·"지도" 링크 — 지도 화면이 생기면 추가.
 * TODO: canonical — 사이트 주소(metadataBase)가 정해지면 쿼리 없는 /book/{isbn13} 으로 지정.
 */

// next/server의 isBot이 못 잡는 국내 검색엔진 크롤러 (네이버 Yeti, 다음 Daumoa 등)
const EXTRA_BOTS = /yeti|daum|bot|crawl|spider|slurp/i;

async function loadBook(isbn13) {
    if (!isValidIsbn13(isbn13)) notFound();

    try {
        return await getBook(isbn13);
    } catch (e) {
        if (e instanceof ApiError && e.status === 404) notFound();
        throw e; // 나머지는 error.jsx
    }
}

// "채식주의자:한강 연작소설" → 본제목 / 부제 (원문은 그대로 두고 보여주는 크기만 나눔)
function splitTitle(title = '') {
    const i = title.indexOf(':');
    if (i <= 0) return { main: title.trim(), sub: '' };
    return { main: title.slice(0, i).trim(), sub: title.slice(i + 1).trim() };
}

function bookHref(isbn13, radiusKm) {
    return radiusKm ? `/book/${isbn13}?r=${radiusKm}` : `/book/${isbn13}`;
}

export async function generateMetadata({ params }) {
    const { isbn13 } = await params;
    const book = await loadBook(isbn13);
    const { main } = splitTitle(book.title);
    const cover = toHttps(book.imageUrl);

    const description = book.description
        ? book.description.slice(0, 150)
        : // 제목 뒤에 조사(을/를)를 붙이지 않는 문장 — 받침에 따라 틀리지 않게
          `《${main}》 소장 도서관과 대출 가능 여부를 확인해 보세요.`;

    return {
        title: `${main} - ${book.authors} | 책어디`,
        description,
        openGraph: {
            title: main,
            description,
            type: 'book',
            images: cover ? [cover] : undefined,
        },
    };
}

export default async function BookPage({ params, searchParams }) {
    const { isbn13 } = await params;
    const query = await searchParams;
    const book = await loadBook(isbn13);

    const radiusKm = readRadiusKm(query.r);

    const ua = (await headers()).get('user-agent') ?? '';
    const isBot = userAgentFromString(ua).isBot || EXTRA_BOTS.test(ua);

    const { main, sub } = splitTitle(book.title);
    const cover = toHttps(book.imageUrl);
    const meta = [book.publisher, book.publicationYear].filter(Boolean).join(' · ');

    return (
        <main className={styles.main}>
            <div className={styles.topBar}>
                <BackLink fallback="/" className={styles.back} />
            </div>

            <header className={styles.head}>
                <div className={styles.cover}>
                    {cover && (
                        // 외부 표지 호스트가 여러 곳이라 img. 첫 화면 큰 이미지라 바로 불러옴
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={`${book.title} 표지`} fetchPriority="high" />
                    )}
                </div>
                <div className={styles.headText}>
                    <h1 className={styles.title}>
                        {main}
                        {sub && <span className={styles.subtitle}>{sub}</span>}
                    </h1>
                    {book.authors && <p className={styles.authors}>{book.authors}</p>}
                    {meta && <p className={styles.meta}>{meta}</p>}
                </div>
                {/* 웹(1024px~) 전용 추가 버튼 — 왼쪽 책 정보와 함께 스크롤을 따라옴 */}
                <div className={styles.headActions}>
                    <AddToBorrowListButton />
                </div>
            </header>

            <section className={styles.holdings} aria-labelledby="holdings-heading">
                <h2 id="holdings-heading" className={styles.sectionTitle}>
                    내 주변에서 빌릴 수 있는 곳
                </h2>
                {/* 기준 위치는 항상 글자로 */}
                <p className={styles.base}>{describeBase(radiusKm)}</p>

                <Suspense key={radiusKm} fallback={<HoldingsSkeleton />}>
                    <Holdings isbn13={isbn13} radiusKm={radiusKm} checkLoan={!isBot} />
                </Suspense>
            </section>

            {book.description && (
                <section className={styles.about} aria-labelledby="about-heading">
                    <h2 id="about-heading" className={styles.sectionTitle}>
                        책 소개
                    </h2>
                    <p className={styles.description}>{book.description}</p>
                </section>
            )}

            {/* 모바일·태블릿 전용 추가 바 — 화면 아래 고정. 웹에서는 위 headActions가 대신함 */}
            <div className={styles.actions}>
                <AddToBorrowListButton />
            </div>

            <BookJsonLd book={book} cover={cover} />
        </main>
    );
}

// 화면에 하나뿐인 Primary 버튼. 모바일 하단 바와 웹 왼쪽 중 한 곳에만 보이도록 CSS로 나눔
// TODO: 빌릴 책 API(/api/borrow-list) 붙이면 추가 연결 (낙관적 업데이트, 실패 시 되돌림). 지금은 모양만 있는 임시 버튼
function AddToBorrowListButton() {
    return (
        <button type="button" className={styles.primary}>
            <PlusIcon size={20} strokeWidth={2.4} />
            빌릴 책에 추가
        </button>
    );
}

async function Holdings({ isbn13, radiusKm, checkLoan }) {
    let data = null;
    try {
        data = await searchLibrariesByBook(isbn13, {
            latitude: DEFAULT_BASE.latitude,
            longitude: DEFAULT_BASE.longitude,
            radius: radiusKm * 1000,
        });
    } catch (e) {
        if (!(e instanceof ApiError)) throw e;
    }

    if (!data) {
        return (
            <Notice
                title="소장 도서관을 불러오지 못했어요"
                action={
                    // 같은 주소를 새로 불러오도록 <a> (JS 없이도 동작)
                    <a href={bookHref(isbn13, radiusKm)} className={styles.secondary}>
                        다시 시도
                    </a>
                }
            />
        );
    }

    const libraries = data.libraries ?? [];

    if (libraries.length === 0) {
        return (
            <Notice
                title={`${formatKm(radiusKm)} 안에 이 책을 가진 도서관이 없어요`}
                action={
                    radiusKm < 10 && (
                        <Link href={bookHref(isbn13, 10)} className={styles.secondary}>
                            10km까지 넓혀 보기
                        </Link>
                    )
                }
            />
        );
    }

    const first = libraries.slice(0, LOAN_BATCH_SIZE);

    return (
        <>
            {/* 첫 묶음: 이름은 바로, 대출 배지는 6곳 결과가 다 오면 한 번에 */}
            <Suspense fallback={<LibraryList isbn13={isbn13} libraries={first} pending={checkLoan} />}>
                <FirstBatch isbn13={isbn13} libraries={first} checkLoan={checkLoan} />
            </Suspense>

            <MoreLibraries
                isbn13={isbn13}
                libraries={libraries.slice(LOAN_BATCH_SIZE)}
                batchSize={LOAN_BATCH_SIZE}
                checkLoan={checkLoan}
            />
        </>
    );
}

async function FirstBatch({ isbn13, libraries, checkLoan }) {
    const statuses = checkLoan
        ? await getLoanStatuses(
              isbn13,
              libraries.map((lib) => lib.libCode)
          )
        : null;

    return <LibraryList isbn13={isbn13} libraries={libraries} statuses={statuses} />;
}

// statuses가 없으면 배지 없이, pending이면 배지 자리에 스켈레톤. 행을 펼치면 청구기호 (HoldingRow)
function LibraryList({ isbn13, libraries, statuses, pending }) {
    return (
        <ul className={styles.libList}>
            {libraries.map((lib) => (
                <HoldingRow
                    key={lib.libCode}
                    isbn13={isbn13}
                    library={lib}
                    badge={
                        pending ? <LoanBadgeSkeleton /> : statuses && <LoanBadge status={statuses[lib.libCode]} />
                    }
                />
            ))}
        </ul>
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

function HoldingsSkeleton() {
    return (
        <LoadingArea label="소장 도서관을 찾고 있어요">
            <ul className={styles.libList}>
                {Array.from({ length: 4 }, (_, i) => (
                    <LibraryRowSkeleton key={i} />
                ))}
            </ul>
        </LoadingArea>
    );
}

// 검색엔진·AI 크롤러용 구조화 데이터 (schema.org Book)
function BookJsonLd({ book, cover }) {
    const data = {
        '@context': 'https://schema.org',
        '@type': 'Book',
        name: book.title,
        isbn: book.isbn13,
        author: book.authors ? { '@type': 'Person', name: book.authors } : undefined,
        publisher: book.publisher ? { '@type': 'Organization', name: book.publisher } : undefined,
        datePublished: book.publicationYear || undefined,
        genre: book.className || undefined,
        image: cover || undefined,
        description: book.description || undefined,
    };

    return (
        <script
            type="application/ld+json"
            // </script> 같은 문자열이 스크립트를 끊지 않게 < 를 이스케이프
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
        />
    );
}
