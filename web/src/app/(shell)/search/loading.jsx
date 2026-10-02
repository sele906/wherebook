import Link from 'next/link';

import { LoadingArea, Skeleton } from '@/components/Skeleton';
import { BackIcon } from '@/components/icons';

import ResultsSkeleton from './ResultsSkeleton';
import styles from './page.module.css';

/*
 * /search 로 이동하는 즉시 보여줄 화면 (검색어가 바뀔 때도).
 * loading.jsx가 있어야 서버 응답을 기다리지 않고 바로 화면이 바뀐다.
 */
export default function SearchLoading() {
    return (
        <main className={styles.main}>
            <div className={styles.bar}>
                <Link href="/" className={styles.back} aria-label="검색 처음 화면으로">
                    <BackIcon size={24} />
                </Link>
                <LoadingArea className={styles.barSkeleton}>
                    <Skeleton height="var(--control-md)" radius="var(--radius-md)" />
                </LoadingArea>
            </div>
            <h1 className="sr-only">책 검색</h1>
            <ResultsSkeleton />
        </main>
    );
}
