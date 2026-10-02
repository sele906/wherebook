import { BackIcon, NextIcon } from './icons';
import { PendingLink } from './PendingNav';
import styles from './Pager.module.css';

const numberFormat = new Intl.NumberFormat('ko-KR');

/*
 * 이전 / 다음 페이지 링크. 서버 렌더링 링크라 JS 없이 동작하고 주소로 공유된다.
 * 미리 불러오기(prefetch)는 끔 — 누르지도 않은 페이지 때문에 백엔드·정보나루를 부르지 않게.
 * PendingNavProvider 안에 있으면 누르는 즉시 결과 자리가 스켈레톤으로 바뀐다 (밖이면 일반 링크).
 * hrefFor(page): 해당 페이지 주소를 만드는 함수 (서버 컴포넌트끼리만 넘김)
 */
export default function Pager({ page, totalPages, hrefFor, label }) {
    if (totalPages <= 1) return null;

    return (
        <nav className={styles.pager} aria-label={label}>
            {/* 없는 쪽은 빈 자리만 두어 가운데 숫자가 흔들리지 않게 함 */}
            {page > 1 ? (
                <PendingLink href={hrefFor(page - 1)} rel="prev" prefetch={false} className={styles.link}>
                    <BackIcon size={18} />
                    이전
                </PendingLink>
            ) : (
                <span className={styles.spacer} />
            )}

            <span className={styles.status}>
                {`${numberFormat.format(page)} / ${numberFormat.format(totalPages)}`}
            </span>

            {page < totalPages ? (
                <PendingLink href={hrefFor(page + 1)} rel="next" prefetch={false} className={styles.link}>
                    다음
                    <NextIcon size={18} />
                </PendingLink>
            ) : (
                <span className={styles.spacer} />
            )}
        </nav>
    );
}

export function readPage(value) {
    const n = Number.parseInt(Array.isArray(value) ? value[0] : value, 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
}
