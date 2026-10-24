import { ApiError, searchLibraries } from '@/api';
import BackLink from '@/components/BackLink';
import LibraryMapLoader from '@/components/map/LibraryMapLoader';
import { getBase } from '@/lib/base';
import { isValidIsbn13 } from '@/lib/ids';
import { DEFAULT_RADIUS_KM, describeBase } from '@/lib/location';

import styles from './page.module.css';

/*
 * 동선 추천 — /borrow-list/route?isbn=978...,978...
 * 빌릴 책에서 고른 책(isbn)을 어느 도서관에서, 어떤 순서로 빌릴지 보여주는 곳 (목업 "동선 추천").
 * 깊은 화면이라 (bare) 그룹: 탭 없이 뒤로가기.
 *
 * 지금은 동선 계산 백엔드가 없어서, 빌릴 책 화면과 같은 기준(기준 위치 + 기본 반경)으로
 * 주변 도서관을 기본 마커로만 지도에 그린다.
 * TODO: 동선 API가 생기면 — 지도에 순서 번호 핀과 경로 선, 아래에 "모두 빌리려면 / 한 곳만 간다면" 카드,
 *       하단 Primary "지도 앱으로 길찾기"
 * TODO: 도서관당 대출 한도(기본 14권)를 동선 계산에 반영 (CLAUDE.md)
 */

export const metadata = {
    title: '동선 추천 | 책어디',
    // 사람마다 다른 개인 화면이라 색인하지 않음
    robots: { index: false, follow: false },
};

// 지도에 그릴 도서관 수 (백엔드 최대 50)
const MAP_LIBRARY_LIMIT = 50;
// 주소로 받는 ISBN 수 상한 (잘못된 긴 주소 방어)
const ISBN_LIMIT = 50;

const countFormat = new Intl.NumberFormat('ko-KR');

// "978...,978..." → 형식이 맞는 ISBN13만, 중복 없이
function readIsbns(value) {
    const raw = Array.isArray(value) ? value.join(',') : (value ?? '');
    const isbns = raw.split(',').map((s) => s.trim()).filter(isValidIsbn13);
    return [...new Set(isbns)].slice(0, ISBN_LIMIT);
}

export default async function RoutePage({ searchParams }) {
    const isbns = readIsbns((await searchParams).isbn);
    const base = await getBase();
    const radiusKm = DEFAULT_RADIUS_KM;

    let libraries = [];
    try {
        const data = await searchLibraries({
            latitude: base.latitude,
            longitude: base.longitude,
            radius: radiusKm * 1000,
            size: MAP_LIBRARY_LIMIT,
        });
        // 지도는 클라이언트로 넘어가서 HTML에 실리므로 마커에 필요한 값만 (운영시간 같은 긴 글 제외)
        libraries = (data.libraries ?? []).map(({ libCode, name, latitude, longitude }) => ({
            libCode,
            name,
            latitude,
            longitude,
        }));
    } catch (e) {
        // 도서관을 못 불러와도 기준 위치 지도는 보여준다
        if (!(e instanceof ApiError)) throw e;
    }

    return (
        <main className={styles.main}>
            <header className={styles.head}>
                <BackLink fallback="/borrow-list" className={styles.back} />
                <div className={styles.headText}>
                    <h1 className={styles.title}>동선 추천</h1>
                    {/* 기준 위치는 항상 글자로 */}
                    <p className={styles.meta}>
                        {isbns.length > 0
                            ? `선택한 ${countFormat.format(isbns.length)}권 · ${describeBase(base, radiusKm)}`
                            : describeBase(base, radiusKm)}
                    </p>
                </div>
            </header>

            <section className={styles.map} aria-label="지도">
                <LibraryMapLoader base={base} libraries={libraries} radiusKm={radiusKm} />
            </section>

            <p className={styles.notice}>동선 추천은 준비 중이에요. 지금은 기준 위치 주변 도서관을 보여 드려요.</p>
        </main>
    );
}
