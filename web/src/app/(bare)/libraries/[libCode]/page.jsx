import { notFound } from 'next/navigation';

import { ApiError, getLibrary } from '@/api';
import BackLink from '@/components/BackLink';
import DirectionLinks from '@/components/DirectionLinks';
import { isValidLibCode } from '@/lib/ids';
import { getBase } from '@/lib/getBase';
import { distanceFrom, formatDistance } from '@/lib/location';

import styles from './page.module.css';

/*
 * 도서관 상세 — /libraries/{libCode}  (색인 대상)
 * 이름·주소·운영 정보를 서버에서 HTML로 그린다. 웹도 한 단.
 *
 * TODO: 운영 상태("운영 중 · 22시까지" / "오늘 휴관") — 운영시간·휴관일 데이터 정제 필요.
 *       지금은 정보나루 원문 그대로 보여줌 (" / " 단위로 줄만 나눔).
 * TODO: 지도 미리보기 — 지도 작업 때 주소 아래에 추가 (클라이언트 전용, dynamic import).
 *       지도가 생기면 웹(1024px~)은 오른쪽에 지도를 두는 두 단으로.
 * TODO: 이 도서관이 가진 책 / 인기 대출 — 백엔드 API가 생기면 추가.
 * 기준 위치는 쿠키(getBase)에서, 없으면 서울 시청.
 */

const numberFormat = new Intl.NumberFormat('ko-KR');

async function loadLibrary(libCode) {
    if (!isValidLibCode(libCode)) notFound();

    try {
        return await getLibrary(libCode);
    } catch (e) {
        if (e instanceof ApiError && e.status === 404) notFound();
        throw e; // 나머지는 error.jsx
    }
}

// 정보나루 원문의 빈 값 표시("-", 공백)는 없는 것으로
function clean(value) {
    const text = value?.trim();
    return text && text !== '-' ? text : null;
}

// "화~금 09:00~21:00 / 토,일 09:00~18:00" → 줄 단위로
function splitLines(text) {
    return (
        clean(text)
            ?.split(/\s*\/\s*/)
            .map((line) => line.trim())
            .filter(Boolean) ?? []
    );
}

// "http://lib.seoul.go.kr/" → "lib.seoul.go.kr" (보여줄 글자만)
function displayHost(url) {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export async function generateMetadata({ params }) {
    const { libCode } = await params;
    const library = await loadLibrary(libCode);

    const description = `${library.name} — ${library.address}. 운영시간, 휴관일, 연락처와 길찾기를 확인해 보세요.`;

    return {
        title: `${library.name} | 책어디`,
        description,
        openGraph: { title: library.name, description, type: 'website' },
    };
}

export default async function LibraryPage({ params }) {
    const { libCode } = await params;
    const library = await loadLibrary(libCode);

    const base = await getBase();
    const distance = distanceFrom(base, library.latitude, library.longitude);
    const hours = splitLines(library.operatingTime);
    const closed = splitLines(library.closedDays);
    const tel = clean(library.tel);
    const homepage = clean(library.homepage);

    return (
        <main className={styles.main}>
            <div className={styles.topBar}>
                <BackLink fallback="/libraries" className={styles.back} />
            </div>

            <header className={styles.head}>
                <h1 className={styles.title}>{library.name}</h1>
                <p className={styles.address}>{library.address}</p>
                {distance != null && (
                    // 기준 위치는 항상 글자로 (DESIGN.md)
                    <p className={styles.distance}>{`${base.label}에서 ${formatDistance(distance)}`}</p>
                )}
            </header>

            <section className={styles.section} aria-labelledby="directions-heading">
                <h2 id="directions-heading" className={styles.sectionTitle}>
                    길찾기
                </h2>
                <div className={styles.directions}>
                    <DirectionLinks library={library} labelledBy="directions-heading" />
                </div>
            </section>

            {(hours.length > 0 || closed.length > 0) && (
                <section className={styles.section} aria-labelledby="hours-heading">
                    <h2 id="hours-heading" className={styles.sectionTitle}>
                        운영 정보
                    </h2>
                    <dl className={styles.info}>
                        {hours.length > 0 && (
                            <div className={styles.infoRow}>
                                <dt>운영시간</dt>
                                <dd>
                                    {hours.map((line) => (
                                        <span key={line} className={styles.line}>
                                            {line}
                                        </span>
                                    ))}
                                </dd>
                            </div>
                        )}
                        {closed.length > 0 && (
                            <div className={styles.infoRow}>
                                <dt>휴관일</dt>
                                <dd>
                                    {closed.map((line) => (
                                        <span key={line} className={styles.line}>
                                            {line}
                                        </span>
                                    ))}
                                </dd>
                            </div>
                        )}
                    </dl>
                    <p className={styles.note}>도서관 사정에 따라 달라질 수 있어요. 방문 전에 도서관에 확인해 보세요.</p>
                </section>
            )}

            <section className={styles.section} aria-labelledby="contact-heading">
                <h2 id="contact-heading" className={styles.sectionTitle}>
                    도서관 정보
                </h2>
                <dl className={styles.info}>
                    {tel && (
                        <div className={styles.infoRow}>
                            <dt>전화</dt>
                            <dd>
                                <a href={`tel:${tel.replace(/[^\d+]/g, '')}`} className={styles.link}>
                                    {tel}
                                </a>
                            </dd>
                        </div>
                    )}
                    {homepage && (
                        <div className={styles.infoRow}>
                            <dt>홈페이지</dt>
                            <dd>
                                <a href={homepage} target="_blank" rel="noopener noreferrer" className={styles.link}>
                                    {displayHost(homepage)}
                                    <span className="sr-only">(새 창)</span>
                                </a>
                            </dd>
                        </div>
                    )}
                    {library.bookCount != null && (
                        <div className={styles.infoRow}>
                            <dt>장서</dt>
                            <dd>{`${numberFormat.format(library.bookCount)}권`}</dd>
                        </div>
                    )}
                </dl>
            </section>

            <LibraryJsonLd library={library} tel={tel} homepage={homepage} />
        </main>
    );
}

// 검색엔진·AI 크롤러용 구조화 데이터 (schema.org Library)
function LibraryJsonLd({ library, tel, homepage }) {
    const data = {
        '@context': 'https://schema.org',
        '@type': 'Library',
        name: library.name,
        address: { '@type': 'PostalAddress', streetAddress: library.address, addressCountry: 'KR' },
        telephone: tel || undefined,
        url: homepage || undefined,
        geo:
            library.latitude != null && library.longitude != null
                ? { '@type': 'GeoCoordinates', latitude: library.latitude, longitude: library.longitude }
                : undefined,
    };

    return (
        <script
            type="application/ld+json"
            // </script> 같은 문자열이 스크립트를 끊지 않게 < 를 이스케이프
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
        />
    );
}
