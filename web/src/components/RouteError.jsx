'use client';

import Link from 'next/link';

import styles from './RouteError.module.css';

/*
 * 페이지를 못 불러왔을 때(백엔드 장애 등) 보여줄 화면. 각 경로의 error.jsx에서 쓴다.
 * 없는 데이터(404)는 not-found로 따로 가고, 여기는 "다시 시도"할 수 있는 오류만.
 * retry(): 서버에서 다시 불러와 그려봄 (Next 16)
 */
export default function RouteError({ title, retry }) {
    return (
        <main className={styles.main}>
            <h1 className={styles.title}>{title}</h1>
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
