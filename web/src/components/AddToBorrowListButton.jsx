'use client';

import { useState } from 'react';

import { addToBorrowList, removeFromBorrowList } from '@/api';
import { borrowListErrorMessage } from '@/lib/borrowListMessages';

import { useBorrowCount } from './BorrowCountProvider';
import { CheckIcon, PlusIcon } from './icons';
import styles from './BookRow.module.css';

/*
 * 책 목록 행의 작은 "추가" ↔ "추가됨" 토글 (BookRow).
 * 처음 상태(initialAdded)는 서버가 빌릴 책 목록으로 확인해서 넘긴다. 모르면(조회 실패) "추가" 모양 —
 * 추가는 여러 번 보내도 결과가 같아서 이미 담긴 책을 눌러도 "추가됨"이 될 뿐이다.
 * 누르면 버튼과 배지 권수를 바로 바꾸고(낙관적 업데이트) 실패하면 둘 다 되돌린 뒤 행 아래에 알려준다.
 * TODO: 최대 권수 제한 — 백엔드에 생기면 그 오류를 받아서 안내
 */
export default function AddToBorrowListButton({ isbn13, title, initialAdded = false }) {
    const [added, setAdded] = useState(initialAdded);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(null);
    const { changeCount } = useBorrowCount();

    async function toggle() {
        if (pending) return;
        const next = !added;
        setAdded(next);
        changeCount(next ? 1 : -1);
        setPending(true);
        setError(null);

        try {
            if (next) await addToBorrowList(isbn13);
            else await removeFromBorrowList(isbn13);
        } catch (e) {
            setAdded(!next);
            changeCount(next ? -1 : 1);
            setError(borrowListErrorMessage(next ? 'add' : 'remove', e));
        } finally {
            setPending(false);
        }
    }

    return (
        <>
            <button
                type="button"
                className={styles.add}
                aria-pressed={added}
                aria-busy={pending || undefined}
                aria-label={`${title} 빌릴 책에 추가`}
                onClick={toggle}
            >
                {added ? <CheckIcon size={16} strokeWidth={2.6} /> : <PlusIcon size={16} strokeWidth={2.4} />}
                <span aria-hidden="true">{added ? '추가됨' : '추가'}</span>
            </button>

            {/* 실패 안내는 행 아래 한 줄로 (li가 줄바꿈 허용) */}
            <p role="status" className={error ? styles.error : 'sr-only'}>
                {error}
            </p>
        </>
    );
}
