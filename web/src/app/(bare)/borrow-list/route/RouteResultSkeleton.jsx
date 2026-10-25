import { LoadingArea, Skeleton } from '@/components/Skeleton';

import styles from './page.module.css';

/*
 * 동선 결과 자리 — 실제 카드와 같은 클래스로 틀을 잡고 글자 자리만 막대로 (내 주변 LibraryRowSkeleton과 같은 방식).
 * 보이는 글자는 두지 않는다. 스크린리더에만 "동선을 계산하고 있어요".
 *   A안 카드: [제목 | 곳·거리] + 방문 도서관 1곳(번호 · 이름 · 책 두 줄)
 *   B안 카드: [제목 | 곳·거리] + 한 줄
 *   길찾기 버튼 자리 (결과가 와도 시트 높이가 덜 바뀌게)
 * page.jsx의 Suspense와 loading.jsx가 같이 씀. 접힌 시트에선 B안 자리가 CSS로 숨겨짐 (.resultLoading).
 */
export default function RouteResultSkeleton() {
    return (
        <LoadingArea label="동선을 계산하고 있어요" className={`${styles.result} ${styles.resultLoading}`}>
            <div className={styles.card}>
                <CardHeadSkeleton titleWidth="7.5rem" />
                <div className={styles.stop}>
                    <Skeleton width="var(--space-6)" height="var(--space-6)" radius="var(--radius-full)" />
                    <div className={styles.stopText}>
                        {/* 줄 높이는 실제 도서관 이름(번호 동그라미 높이)과 같게, 막대는 글자 크기로 */}
                        <div className={styles.stopNameSkeleton}>
                            <Skeleton width="10rem" height="var(--text-base)" />
                        </div>
                        <BookLineSkeleton titleWidth="7rem" />
                        <BookLineSkeleton titleWidth="9rem" />
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <CardHeadSkeleton titleWidth="6rem" />
                <Skeleton width="12rem" height="var(--text-md)" />
            </div>

            <div className={styles.directionsSkeleton}>
                <Skeleton height="var(--control-lg)" radius="var(--radius-md)" />
            </div>
        </LoadingArea>
    );
}

function CardHeadSkeleton({ titleWidth }) {
    return (
        <div className={styles.cardHead}>
            <Skeleton width={titleWidth} height="var(--text-lg)" />
            <Skeleton width="4rem" height="var(--text-md)" />
        </div>
    );
}

// 책 한 줄: [제목] [출판사 연도]
function BookLineSkeleton({ titleWidth }) {
    return (
        <div className={styles.bookLine}>
            <Skeleton width={titleWidth} height="var(--text-md)" />
            <Skeleton width="4.5rem" height="var(--text-sm)" />
        </div>
    );
}
