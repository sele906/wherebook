import BackLink from '@/components/BackLink';
import { LoadingArea, Skeleton } from '@/components/Skeleton';

import styles from './page.module.css';

// /libraries/{libCode} 로 이동하는 즉시 보여줄 화면 (이름·주소 → 길찾기 버튼 줄 → 운영 정보 자리)
export default function LibraryLoading() {
    return (
        <main className={styles.main}>
            <div className={styles.topBar}>
                <BackLink fallback="/libraries" className={styles.back} />
            </div>

            <LoadingArea label="도서관 정보를 불러오고 있어요">
                <div className={styles.head}>
                    <Skeleton width="12rem" height="var(--text-xl)" />
                    <Skeleton width="16rem" />
                    <Skeleton width="6rem" height="var(--text-sm)" />
                </div>
                <div className={styles.section}>
                    <Skeleton width="4rem" height="var(--text-lg)" />
                    <div className={styles.directions}>
                        <Skeleton height="var(--touch)" radius="var(--radius-md)" />
                    </div>
                </div>
                <div className={styles.section}>
                    <Skeleton width="6rem" height="var(--text-lg)" />
                    <div className={styles.info}>
                        {Array.from({ length: 2 }, (_, i) => (
                            <div key={i} className={styles.infoRow}>
                                <Skeleton width="4rem" height="var(--text-md)" />
                                <Skeleton width="12rem" />
                            </div>
                        ))}
                    </div>
                </div>
            </LoadingArea>
        </main>
    );
}
