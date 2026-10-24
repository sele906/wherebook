import { LoadingArea, Skeleton } from '@/components/Skeleton';
import LibraryMapSkeleton from '@/components/map/LibraryMapSkeleton';

import ResultsSkeleton from './ResultsSkeleton';
import TitleRow from './TitleRow';
import styles from './page.module.css';

/*
 * /libraries 로 이동하는 즉시 보여줄 화면 (검색어·반경이 바뀔 때도).
 * loading.jsx가 있어야 서버 응답을 기다리지 않고 바로 화면이 바뀐다.
 * page와 같은 배치(왼쪽 패널 + 지도 칸)로 자리만 잡는다. 지도 칸은 웹에서만 보임.
 */
export default function LibrariesLoading() {
    return (
        <main className={styles.main}>
            <div className={styles.panel}>
                <TitleRow />
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
            </div>
            <div className={styles.mapPane} aria-hidden="true">
                <LibraryMapSkeleton />
            </div>
        </main>
    );
}
