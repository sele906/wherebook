import { LibraryRowSkeleton } from '@/components/LibraryRow';
import { LoadingArea, Skeleton } from '@/components/Skeleton';
import { describeBase } from '@/lib/location';

import styles from './page.module.css';

/*
 * 도서관 목록 자리 (기준 위치 + 6행). page.jsx의 Suspense와 loading.jsx가 같이 씀.
 * radiusKm를 알면 기준 위치는 글자로 바로 보여주고, 모르면(loading.jsx) 자리만 잡는다.
 */
export default function ResultsSkeleton({ radiusKm }) {
    return (
        <>
            {radiusKm ? (
                <p className={styles.base}>{describeBase(radiusKm)}</p>
            ) : (
                <LoadingArea className={styles.base}>
                    <Skeleton width="10rem" height="var(--text-sm)" />
                </LoadingArea>
            )}
            <LoadingArea label="도서관을 찾고 있어요">
                <ul className={styles.list}>
                    {Array.from({ length: 6 }, (_, i) => (
                        <LibraryRowSkeleton key={i} />
                    ))}
                </ul>
            </LoadingArea>
        </>
    );
}
