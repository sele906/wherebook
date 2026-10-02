import { CheckIcon } from './icons';
import styles from './LoanBadge.module.css';

/*
 * 대출 상태 배지. 조회는 하지 않고 결과(LoanStatusResponse)만 받아 그린다
 * — 서버(첫 묶음)와 클라이언트(더 보기 묶음) 양쪽에서 같은 모양으로 쓰기 위해.
 *
 * DESIGN.md 대출 상태 표시:
 *   대출 가능 = --brand-subtle 바탕 + 체크 아이콘 + "대출 가능"
 *   대출중   = --surface 바탕 + "대출중"
 *   미소장   = 표시 안 함
 *   조회 실패 = 그 행만 "확인 실패" (일부 실패해도 나머지는 보여줌)
 */
export default function LoanBadge({ status }) {
    if (!status || status.status !== 'OK') {
        return <span className={`${styles.badge} ${styles.failed}`}>확인 실패</span>;
    }

    if (!status.bookExists) return null;

    if (status.loanAvailable) {
        return (
            <span className={`${styles.badge} ${styles.available}`}>
                <CheckIcon size={14} strokeWidth={2.6} />
                대출 가능
            </span>
        );
    }

    return <span className={`${styles.badge} ${styles.onLoan}`}>대출중</span>;
}

export function LoanBadgeSkeleton() {
    return (
        <span className={`${styles.badge} ${styles.skeleton}`} aria-hidden="true">
            대출 가능
        </span>
    );
}
