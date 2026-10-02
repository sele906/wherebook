import Link from 'next/link';

import { formatDistance } from '@/lib/location';

import styles from './LibraryRow.module.css';

/*
 * 소장 도서관 한 행. 행 전체가 도서관 상세 링크, 오른쪽 badge 자리에 대출 상태.
 * 서버·클라이언트 양쪽에서 쓰는 모양 전용 컴포넌트 (데이터 조회 없음).
 *
 * TODO: 도서관 상세 경로가 /library/[libCode] 로 바뀌면 href 수정.
 */
export default function LibraryRow({ library, badge, linkRef }) {
    return (
        <li className={styles.item}>
            <Link href={`/libraries/${library.libCode}`} className={styles.row} ref={linkRef}>
                <span className={styles.text}>
                    <span className={styles.name}>{library.name}</span>
                    {library.distance != null && <span className={styles.meta}>{formatDistance(library.distance)}</span>}
                </span>
                {badge}
            </Link>
        </li>
    );
}

/* 이름까지 모를 때(목록 자체를 불러오는 중) 쓰는 행 */
export function LibraryRowSkeleton() {
    return (
        <li className={styles.item} aria-hidden="true">
            <span className={styles.row}>
                <span className={styles.text}>
                    <span className={`${styles.bar} ${styles.barName}`} />
                    <span className={`${styles.bar} ${styles.barMeta}`} />
                </span>
            </span>
        </li>
    );
}
