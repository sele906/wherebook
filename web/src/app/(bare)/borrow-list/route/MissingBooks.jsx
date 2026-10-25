'use client';

import { useState } from 'react';

import { CircleAlertIcon } from '@/components/icons';

import styles from './page.module.css';

/*
 * 못 빌리는 책 한 줄 — [! 2권은 1km 안에서 못 빌려요] [반경 넓히기]
 * 왼쪽을 누르면 아래에 책 목록이 펼쳐진다 (aria-expanded). "반경 넓히기"는 버튼 안에 넣지 않고 옆에 둔 링크.
 * summary·widen·children(목록)은 서버에서 그려서 넘긴다.
 */
export default function MissingBooks({ summary, widen, children }) {
    const [open, setOpen] = useState(false);

    return (
        <div className={styles.missing}>
            <div className={styles.missingBar}>
                <button
                    type="button"
                    className={styles.missingToggle}
                    aria-expanded={open}
                    aria-controls="route-missing-list"
                    onClick={() => setOpen(!open)}
                >
                    <CircleAlertIcon size={18} strokeWidth={2.2} className={styles.missingIcon} />
                    <span className={styles.missingSummary}>{summary}</span>
                </button>
                {widen}
            </div>
            <div id="route-missing-list" hidden={!open}>
                {children}
            </div>
        </div>
    );
}
