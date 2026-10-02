'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import LibraryRow from '@/components/LibraryRow';
import LoanBadge, { LoanBadgeSkeleton } from '@/components/LoanBadge';

import { loadLoanStatuses } from './actions';
import styles from './MoreLibraries.module.css';

const numberFormat = new Intl.NumberFormat('ko-KR');
const ERROR_STATUS = { bookExists: false, loanAvailable: false, status: 'ERROR' };

/*
 * 첫 묶음 다음의 소장 도서관들. "더 보기"를 누를 때마다 batchSize 곳씩 붙이고,
 * 새로 붙인 곳의 대출 여부만 한 번에 조회해서 배지를 함께 채운다 (이미 조회한 곳은 다시 안 부름).
 * 목록 데이터는 서버가 받은 소장 도서관 응답 그대로라 목록 자체는 다시 호출하지 않는다.
 */
export default function MoreLibraries({ isbn13, libraries, batchSize, checkLoan }) {
    const [shownCount, setShownCount] = useState(0);
    const [statuses, setStatuses] = useState({});
    const [, startTransition] = useTransition();
    const firstNewLinkRef = useRef(null);
    const [focusIndex, setFocusIndex] = useState(null);

    // 새로 붙은 첫 행으로 포커스를 옮겨 키보드·스크린리더 사용자가 이어서 볼 수 있게
    useEffect(() => {
        if (focusIndex !== null) firstNewLinkRef.current?.focus();
    }, [focusIndex]);

    const shown = libraries.slice(0, shownCount);
    const remaining = libraries.length - shownCount;

    function showMore() {
        const next = libraries.slice(shownCount, shownCount + batchSize);
        setFocusIndex(shownCount);
        setShownCount(shownCount + next.length);

        if (!checkLoan) return;

        const codes = next.map((lib) => lib.libCode);
        startTransition(async () => {
            let result;
            try {
                result = await loadLoanStatuses(isbn13, codes);
            } catch {
                result = Object.fromEntries(codes.map((code) => [code, ERROR_STATUS]));
            }
            setStatuses((prev) => ({ ...prev, ...result }));
        });
    }

    if (libraries.length === 0) return null;

    return (
        <>
            {shown.length > 0 && (
                <ul className={styles.list}>
                    {shown.map((lib, i) => (
                        <LibraryRow
                            key={lib.libCode}
                            library={lib}
                            linkRef={i === focusIndex ? firstNewLinkRef : undefined}
                            badge={
                                checkLoan &&
                                (lib.libCode in statuses ? <LoanBadge status={statuses[lib.libCode]} /> : <LoanBadgeSkeleton />)
                            }
                        />
                    ))}
                </ul>
            )}

            {remaining > 0 && (
                <button type="button" onClick={showMore} className={styles.more}>
                    {`소장 도서관 더 보기 (남은 ${numberFormat.format(remaining)}곳)`}
                </button>
            )}
        </>
    );
}
