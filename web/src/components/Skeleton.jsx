import styles from './Skeleton.module.css';

/*
 * 로딩 자리표시. 화면 전체 스피너 대신 실제 레이아웃 모양으로 자리를 잡는다 (DESIGN.md 화면 상태).
 *
 * <LoadingArea label>: 불러오는 영역을 감싼다.
 *   - 스크린리더에는 label("…불러오고 있어요")을 알림 (role="status"). 한 화면에 label은 한 곳만.
 *     label 없이 쓰면 알림 없이 "늦게 나타나기"만 함 (같은 화면의 머리 부분 등)
 *   - 300ms 안에 끝나면 아예 안 보이게 늦게 나타남 → 빠른 응답에서 깜빡임 없음
 * <Skeleton width height radius>: 회색 블록 하나. 크기는 CSS 변수/rem 값으로 넘긴다.
 */
export function LoadingArea({ label, children, className }) {
    return (
        <div role={label ? 'status' : undefined} className={className ? `${styles.area} ${className}` : styles.area}>
            {label && <span className="sr-only">{label}</span>}
            <div aria-hidden="true">{children}</div>
        </div>
    );
}

export function Skeleton({ width = '100%', height = 'var(--text-base)', radius = 'var(--radius-sm)', className }) {
    return (
        <span
            className={className ? `${styles.block} ${className}` : styles.block}
            style={{ '--skeleton-w': width, '--skeleton-h': height, '--skeleton-r': radius }}
        />
    );
}
