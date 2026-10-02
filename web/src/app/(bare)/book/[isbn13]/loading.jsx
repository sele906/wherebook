import BackLink from '@/components/BackLink';
import { LibraryRowSkeleton } from '@/components/LibraryRow';
import { LoadingArea, Skeleton } from '@/components/Skeleton';

import styles from './page.module.css';

/*
 * /book/{isbn13} 로 이동하는 즉시 보여줄 화면 (책 정보 → 소장 도서관 자리).
 * loading.jsx가 있어야 서버 응답을 기다리지 않고 바로 화면이 바뀐다.
 */
export default function BookLoading() {
    return (
        <main className={styles.main}>
            <div className={styles.topBar}>
                <BackLink fallback="/" className={styles.back} />
            </div>

            <LoadingArea label="책 정보를 불러오고 있어요" className={styles.loadingHead}>
                <div className={styles.head}>
                    <div className={styles.cover} />
                    <div className={styles.headText}>
                        <Skeleton width="12rem" height="var(--text-xl)" />
                        <Skeleton width="6rem" />
                        <Skeleton width="8rem" height="var(--text-sm)" />
                    </div>
                </div>
            </LoadingArea>

            <LoadingArea className={styles.holdings}>
                <Skeleton width="14rem" height="var(--text-lg)" />
                <ul className={styles.libList}>
                    {Array.from({ length: 4 }, (_, i) => (
                        <LibraryRowSkeleton key={i} />
                    ))}
                </ul>
            </LoadingArea>
        </main>
    );
}
