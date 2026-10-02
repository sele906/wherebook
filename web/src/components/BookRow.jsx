import Link from 'next/link';

import { toHttps } from '@/lib/url';

import { PlusIcon } from './icons';
import { Skeleton } from './Skeleton';
import styles from './BookRow.module.css';

/*
 * 책 목록 한 행. 왼쪽 표지·제목·메타 전체가 책 상세 링크 하나, 오른쪽 "추가"는 링크 밖.
 * 책 제목·저자·출판사는 데이터 원문 그대로 (번역·가공 안 함).
 */

export default function BookRow({ book }) {
    const meta = [book.authors, book.publisher, book.publicationYear].filter(Boolean).join(' · ');
    const cover = toHttps(book.imageUrl);

    return (
        <li className={styles.row}>
            <Link href={`/book/${book.isbn13}`} className={styles.link}>
                <span className={styles.cover}>
                    {cover && (
                        // 표지는 여러 외부 호스트라 next/image 대신 img로 지연 로딩만 함. 자리는 .cover가 5:7로 잡음
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={`${book.title} 표지`} loading="lazy" decoding="async" />
                    )}
                </span>
                <span className={styles.text}>
                    <span className={styles.title}>{book.title}</span>
                    {meta && <span className={styles.meta}>{meta}</span>}
                </span>
            </Link>

            {/* TODO: 빌릴 책 API(/api/borrow-list) 붙이면 추가/빼기 연결 (낙관적 업데이트, 실패 시 되돌림).
                      추가한 책은 aria-pressed="true" + --brand-subtle 바탕 + "추가됨" 으로 바뀜.
                      지금은 모양만 있는 임시 버튼. */}
            <button type="button" className={styles.add} aria-pressed="false" aria-label={`${book.title} 빌릴 책에 추가`}>
                <PlusIcon size={16} strokeWidth={2.4} />
                <span aria-hidden="true">추가</span>
            </button>
        </li>
    );
}

/* 로딩 중 같은 모양으로 자리만 잡아두는 행 */
export function BookRowSkeleton() {
    return (
        <li className={styles.row} aria-hidden="true">
            <span className={styles.link}>
                <span className={styles.cover} />
                <span className={styles.text}>
                    <Skeleton width="10rem" />
                    <Skeleton width="7rem" height="var(--text-sm)" />
                </span>
            </span>
        </li>
    );
}
