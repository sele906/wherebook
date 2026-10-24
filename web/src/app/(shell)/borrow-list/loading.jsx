import { LoadingArea, Skeleton } from '@/components/Skeleton';

import styles from './page.module.css';

/*
 * /borrow-list 로 이동하는 즉시 보여줄 화면. 서버가 빌릴 책 목록을 받아 오는 동안 실제 모양으로 자리만 잡는다.
 */
export default function BorrowListLoading() {
    return (
        <main className={styles.main}>
            <header className={styles.head}>
                <h1 className={styles.title}>빌릴 책</h1>
            </header>
            <LoadingArea label="빌릴 책을 불러오고 있어요">
                <Skeleton height="var(--control-md)" radius="var(--radius-lg)" />
                <ul className={styles.list}>
                    {Array.from({ length: 3 }, (_, i) => (
                        <li key={i} className={styles.row}>
                            <span className={styles.cover} />
                            <span className={styles.text}>
                                <Skeleton width="10rem" />
                                <Skeleton width="5rem" height="var(--text-sm)" />
                            </span>
                        </li>
                    ))}
                </ul>
            </LoadingArea>
        </main>
    );
}
