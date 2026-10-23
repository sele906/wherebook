import { LibraryRowSkeleton } from '@/components/LibraryRow';
import { LoadingArea, Skeleton } from '@/components/Skeleton';

import styles from './page.module.css';

/*
 * 도서관 목록 자리 (요약 줄 + 6행). page.jsx의 Suspense와 loading.jsx가 같이 씀.
 * 기준 위치는 제목(TitleRow)에 있으니 여기서는 "3km 안에 도서관 N곳" 줄 자리만 잡는다.
 */
export default function ResultsSkeleton() {
    return (
        <>
            <LoadingArea className={styles.base}>
                <Skeleton width="9rem" height="var(--text-md)" />
            </LoadingArea>
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
