'use client';

import Link from 'next/link';

import styles from './error.module.css';

/*
 * 책 정보를 못 불러왔을 때 (백엔드 장애 등). 없는 ISBN은 404(not-found)로 따로 감.
 * retry(): 서버에서 다시 불러와 그려봄 (Next 16)
 */
export default function BookError({ retry }) {
    return (
        <main className={styles.main}>
            <h1 className={styles.title}>책 정보를 불러오지 못했어요</h1>
            <p className={styles.text}>잠시 후 다시 시도해 주세요.</p>
            <div className={styles.actions}>
                <button type="button" onClick={() => retry()} className={styles.secondary}>
                    다시 시도
                </button>
                <Link href="/" className={styles.textLink}>
                    검색으로 가기
                </Link>
            </div>
        </main>
    );
}
