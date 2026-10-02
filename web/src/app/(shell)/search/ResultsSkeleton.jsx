import { BookRowSkeleton } from '@/components/BookRow';
import { LoadingArea, Skeleton } from '@/components/Skeleton';

import styles from './page.module.css';

// 검색 결과 자리 (결과 수 + 책 6행). page.jsx의 Suspense와 loading.jsx가 같이 씀
export default function ResultsSkeleton() {
    return (
        <LoadingArea label="검색하고 있어요">
            <div className={styles.count}>
                <Skeleton width="5rem" height="var(--text-md)" />
            </div>
            <ul className={styles.list}>
                {Array.from({ length: 6 }, (_, i) => (
                    <BookRowSkeleton key={i} />
                ))}
            </ul>
        </LoadingArea>
    );
}
