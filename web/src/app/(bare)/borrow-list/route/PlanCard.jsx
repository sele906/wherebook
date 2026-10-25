'use client';

import { usePlanSelection } from './PlanSelection';
import styles from './page.module.css';

/*
 * 안 고르기 카드 (A안 "N권 다 빌리기" / B안 "한 곳만 가기"). 누르면 그 안이 선택되고 aria-pressed로 알림.
 * 내용은 서버에서 그려서 children으로 받는다. 버튼 안이라 children은 span만 쓴다 (제목·목록 태그 불가).
 * 안이 하나뿐이면 고를 게 없어서 버튼 대신 선택된 모양의 일반 카드 (StaticPlanCard).
 */
export default function PlanCard({ value, children }) {
    const { plan, setPlan } = usePlanSelection();

    return (
        <button
            type="button"
            className={styles.card}
            aria-pressed={plan === value}
            onClick={() => setPlan(value)}
        >
            {children}
        </button>
    );
}

export function StaticPlanCard({ children }) {
    return (
        <div className={styles.card} data-selected="true">
            {children}
        </div>
    );
}
