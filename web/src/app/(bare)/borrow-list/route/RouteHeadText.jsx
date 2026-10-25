import { LoadingArea, Skeleton } from '@/components/Skeleton';
import { describeBase } from '@/lib/location';

import { loadRoute } from './loadRoute';
import styles from './page.module.css';

const countFormat = new Intl.NumberFormat('ko-KR');

/*
 * 머리 글자 — 제목 "동선 추천" + 부제 "5권 중 3권 빌릴 수 있어요 · 서울 시청 기준 1km".
 * 부제 숫자는 동선 응답(loadRoute cache)이 와야 알아서, 불러오는 동안은 제목까지 같이 막대(RouteHeadTextSkeleton).
 * 제목만 먼저 보이면 튀고, "반경 넓히기" 때는 예전 반경 글자가 남아 헷갈려서 통째로 바꾼다.
 * 기준 위치는 항상 글자로 (지도 칩이 생기기 전까지 여기서 보여줌). 실패하면 "선택한 5권 · …".
 */
export default async function RouteHeadText({ base, isbnKey, radiusKm, selectedCount }) {
    const data = await loadRoute(isbnKey, base.latitude, base.longitude, radiusKm);

    let summary;
    if (!data) {
        summary = `선택한 ${countFormat.format(selectedCount)}권 · ${describeBase(base, radiusKm)}`;
    } else {
        const borrowable = data.allAvailableBooksRoute?.borrowableBookCount ?? 0;
        const total = borrowable + (data.onLoanNearby?.length ?? 0) + (data.notFoundNearby?.length ?? 0);
        summary = (
            <>
                {countFormat.format(total)}권 중 <strong>{countFormat.format(borrowable)}권</strong> 빌릴 수 있어요 ·{' '}
                {describeBase(base, radiusKm)}
            </>
        );
    }

    return (
        <div className={styles.headText}>
            <h1 className={styles.title}>동선 추천</h1>
            <p className={styles.meta}>{summary}</p>
        </div>
    );
}

// 불러오는 중: 제목·부제 자리를 글자 줄 높이 그대로 막대로 (글자가 와도 머리가 들썩이지 않게).
// 제목은 화면에서만 가리고 스크린리더용 h1은 남긴다. loading.jsx와 page.jsx(Suspense·반경 넓히기)가 같이 씀
export function RouteHeadTextSkeleton() {
    return (
        <div className={styles.headText}>
            <h1 className="sr-only">동선 추천</h1>
            <LoadingArea>
                <div className={styles.titleSkeleton}>
                    <Skeleton width="5.5rem" height="var(--text-lg)" />
                </div>
                <div className={styles.metaSkeleton}>
                    <Skeleton width="11rem" height="var(--text-sm)" />
                </div>
            </LoadingArea>
        </div>
    );
}
