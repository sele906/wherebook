'use client';

import { createContext, use, useEffect, useRef, useState } from 'react';

import { addToBorrowList, getBorrowList, removeFromBorrowList } from '@/api';
import { useBorrowCount } from '@/components/BorrowCountProvider';
import { CheckIcon, PlusIcon } from '@/components/icons';
import { borrowListErrorMessage } from '@/lib/borrowListMessages';

import styles from './page.module.css';

/*
 * 책 상세의 "빌릴 책에 추가" ↔ "추가됨" 토글.
 * 버튼이 모바일 하단 바와 웹 왼쪽에 하나씩 있어서(CSS로 한 곳만 보임) 상태는 Provider 하나가 들고,
 * 두 버튼은 같은 상태를 읽는다 (빌릴 책 목록 조회도 한 번).
 *
 * - 처음 상태(initialAdded)는 서버가 확인해서 넘겨준다 → 이미 담긴 책은 처음부터 "추가됨".
 *   서버가 확인하지 못했으면(null) 브라우저에서 빌릴 책 목록을 불러와 정한다. 응답 전에는 "추가" 모양.
 * - 누르면 바로 바꾸고(낙관적 업데이트) 요청이 실패하면 되돌린 뒤 버튼 아래에 알려준다.
 * - 추가·빼기 둘 다 여러 번 보내도 결과가 같아서, 목록 응답 전에 눌러도 안전하다.
 * TODO: 최대 권수 제한 — 백엔드에 생기면 그 오류(상태 코드·문구)를 받아서 안내
 * 웹 헤더의 빌릴 책 배지 권수도 누르는 즉시 ±1, 실패하면 되돌린다 (changeCount).
 * TODO: 뒤로가기로 돌아오면 이전에 그린 화면을 다시 쓸 수 있다 (다른 화면에서 빼면 잠깐 "추가됨"으로 남음)
 */

const BorrowListContext = createContext(null);

const DONE_MESSAGES = {
    added: '빌릴 책에 추가했어요',
    removed: '빌릴 책에서 뺐어요',
};

export function BorrowListProvider({ isbn13, initialAdded, children }) {
    // null = 아직 모름 (목록 응답 전)
    const [added, setAdded] = useState(initialAdded);
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState(null); // { text, error }
    // 목록 응답보다 먼저 누르면, 늦게 온 응답이 누른 결과를 덮지 않게
    const touchedRef = useRef(false);
    const { changeCount } = useBorrowCount();

    useEffect(() => {
        if (initialAdded !== null) return; // 서버가 이미 확인함
        let ignore = false;
        getBorrowList()
            .then((items) => {
                if (ignore || touchedRef.current) return;
                setAdded(items.some((item) => item.isbn13 === isbn13));
            })
            .catch(() => {
                // 몰라도 누르면 동작하므로 "추가" 모양으로 둔다
                if (!ignore && !touchedRef.current) setAdded(false);
            });
        return () => {
            ignore = true;
        };
    }, [isbn13, initialAdded]);

    async function toggle() {
        if (pending) return;
        touchedRef.current = true;

        const next = !added;
        setAdded(next);
        changeCount(next ? 1 : -1);
        setPending(true);
        setMessage(null);

        try {
            if (next) await addToBorrowList(isbn13);
            else await removeFromBorrowList(isbn13);
            setMessage({ text: DONE_MESSAGES[next ? 'added' : 'removed'], error: false });
        } catch (e) {
            setAdded(!next);
            changeCount(next ? -1 : 1);
            setMessage({ text: borrowListErrorMessage(next ? 'add' : 'remove', e), error: true });
        } finally {
            setPending(false);
        }
    }

    return (
        <BorrowListContext value={{ added: added === true, pending, message, toggle }}>
            {children}
        </BorrowListContext>
    );
}

// 화면에 하나뿐인 Primary 버튼. 추가되면 연한 면(brand-subtle) + 체크로 바뀐다
export default function BorrowListButton() {
    const { added, pending, message, toggle } = use(BorrowListContext);

    return (
        <>
            <button
                type="button"
                className={styles.primary}
                aria-pressed={added}
                aria-busy={pending || undefined}
                onClick={toggle}
            >
                {added ? <CheckIcon size={20} strokeWidth={2.6} /> : <PlusIcon size={20} strokeWidth={2.4} />}
                {added ? '추가됨' : '빌릴 책에 추가'}
            </button>

            {/* 결과 안내. 성공은 스크린리더만, 실패는 화면에도 보여준다 */}
            <p role="status" className={message?.error ? styles.borrowError : 'sr-only'}>
                {message?.text}
            </p>
        </>
    );
}
