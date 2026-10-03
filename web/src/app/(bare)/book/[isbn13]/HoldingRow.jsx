'use client';

import { useState } from 'react';
import Link from 'next/link';

import DirectionLinks from '@/components/DirectionLinks';
import { NextIcon } from '@/components/icons';
import { LoadingArea, Skeleton } from '@/components/Skeleton';
import { formatDistance } from '@/lib/location';

import { loadCallNumber } from './actions';
import styles from './HoldingRow.module.css';

/*
 * 소장 도서관 한 행. 누르면 살짝 펼쳐지면서 이 도서관에서의 청구기호(+ 자료실)와 길찾기 버튼을 보여준다.
 * 청구기호는 처음 펼칠 때 이 도서관 하나만 조회하고, 다시 접었다 펴도 또 부르지 않는다.
 *
 * <details>라 JS 없이도 펼쳐지고 키보드(Enter/Space)로 쓸 수 있다.
 * 도서관 상세 링크는 펼친 영역 안에 있지만 접혀 있어도 HTML에 들어 있어 검색엔진이 따라갈 수 있다.
 * badge: 대출 상태 배지 (서버에서 그린 것도, 클라이언트에서 그린 것도 받음)
 */
export default function HoldingRow({ isbn13, library, badge, summaryRef }) {
    // idle → loading → done(result) | failed
    const [callNumber, setCallNumber] = useState({ state: 'idle' });

    async function fetchCallNumber() {
        setCallNumber({ state: 'loading' });
        try {
            const result = await loadCallNumber(isbn13, library.libCode);
            setCallNumber({ state: 'done', result });
        } catch {
            setCallNumber({ state: 'done', result: { status: 'ERROR' } });
        }
    }

    function handleToggle(e) {
        if (e.currentTarget.open && callNumber.state === 'idle') fetchCallNumber();
    }

    const panelId = `holding-${library.libCode}`;

    return (
        <li className={styles.item}>
            <details className={styles.details} onToggle={handleToggle}>
                <summary className={styles.row} ref={summaryRef} aria-controls={panelId}>
                    <span className={styles.text}>
                        <span className={styles.name}>{library.name}</span>
                        {library.distance != null && <span className={styles.meta}>{formatDistance(library.distance)}</span>}
                    </span>
                    {badge}
                    <span className={styles.chevron} aria-hidden="true">
                        <NextIcon size={18} />
                    </span>
                </summary>

                <div id={panelId} className={styles.panel}>
                    <CallNumber library={library} callNumber={callNumber} onRetry={fetchCallNumber} />
                    {/* 청구기호를 확인한 뒤 바로 갈 수 있게. 길찾기 제목은 따로 두지 않음 */}
                    <div className={styles.directions}>
                        <DirectionLinks library={library} label={`${library.name} 길찾기`} />
                    </div>
                    <Link href={`/libraries/${library.libCode}`} className={styles.libraryLink}>
                        도서관 정보 보기
                    </Link>
                </div>
            </details>
        </li>
    );
}

function CallNumber({ library, callNumber, onRetry }) {
    if (callNumber.state === 'loading') {
        return (
            <LoadingArea label="청구기호를 불러오고 있어요" className={styles.callNumberLoading}>
                <Skeleton width="3rem" height="var(--text-sm)" />
                <Skeleton width="8rem" height="var(--text-lg)" />
            </LoadingArea>
        );
    }

    if (callNumber.state !== 'done') return null;

    const { status, items = [] } = callNumber.result;

    // 청구기호마다 대출 가능 여부를 알 수 없어서 대표·후보 구분 없이 모두 보여준다 (서버가 복본 많은 순으로 정렬)
    if (status === 'OK' && items.length > 0) {
        return (
            <div className={styles.callNumber}>
                <p className={styles.callNumberLabel}>
                    {items.length > 1 ? `청구기호 ${items.length}개` : '청구기호'}
                </p>
                <ul className={styles.callNumberList}>
                    {items.map((item, i) => {
                        // 자료실이 도서관 이름과 같으면 정보가 없으므로 생략
                        const shelf = item.shelfLocation && item.shelfLocation !== library.name ? item.shelfLocation : null;
                        return (
                            <li key={i} className={styles.callNumberItem}>
                                <span className={styles.callNumberValue}>{item.callNumber}</span>
                                <span className={styles.callNumberMeta}>
                                    {shelf ? `${shelf} · ${item.copyCount}권` : `${item.copyCount}권`}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }

    if (status === 'NOT_FOUND') {
        return <p className={styles.message}>이 도서관의 청구기호 정보가 없어요. 도서관에 문의해 주세요.</p>;
    }

    return (
        <p className={styles.message}>
            청구기호를 불러오지 못했어요.
            <button type="button" onClick={onRetry} className={styles.retry}>
                다시 시도
            </button>
        </p>
    );
}
