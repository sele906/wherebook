import { LoadingArea, Skeleton } from '@/components/Skeleton';

import ResultsSkeleton from './ResultsSkeleton';
import styles from './page.module.css';

/*
 * /libraries 로 이동하는 즉시 보여줄 화면 (검색어·반경이 바뀔 때도).
 * loading.jsx가 있어야 서버 응답을 기다리지 않고 바로 화면이 바뀐다.
 */
export default function LibrariesLoading() {
    return (
        <main className={styles.main}>
            <h1 className={styles.title}>내 주변</h1>
            <LoadingArea>
                <div className={styles.search}>
                    <Skeleton height="var(--control-md)" radius="var(--radius-md)" />
                </div>
                <Skeleton
                    className={styles.radiusSkeleton}
                    height="calc(var(--touch) + var(--space-2))"
                    radius="var(--radius-md)"
                />
            </LoadingArea>
            <ResultsSkeleton />
        </main>
    );
}
