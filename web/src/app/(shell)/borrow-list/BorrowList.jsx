'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { removeFromBorrowList } from '@/api';
import { useBorrowCount } from '@/components/BorrowCountProvider';
import { CloseIcon, RouteIcon, SearchIcon } from '@/components/icons';
import { borrowListErrorMessage } from '@/lib/borrowListMessages';
import { toHttps } from '@/lib/url';

import styles from './page.module.css';

/*
 * 빌릴 책 목록 (클라이언트). 처음 목록은 서버가 넘겨준 API 응답(initialItems)이고, 프론트에 따로 원본을 두지 않는다.
 * - 빼기(✕ / 선택한 책 빼기): 바로 목록에서 지우고(낙관적 업데이트) 실패한 책만 제자리로 되돌린 뒤 알려준다.
 * - 선택: 처음엔 전부 선택. 동선 짜기에 쓸 책을 고르는 용도.
 * - 동선 짜기: 화면이 아직 없어서 누르면 이유를 안내한다 (비활성 대신 누르면 안내 — DESIGN.md).
 * TODO: 동선 화면(/route)이 생기면 선택한 ISBN으로 이동
 * TODO: 최대 권수·도서관당 대출 한도(기본 14권) 안내
 * 하단 탭·헤더 배지 권수는 이 목록 길이에 맞춘다 (빼면 바로 줄고, 실패해서 되돌리면 다시 늘어남).
 */

const countFormat = new Intl.NumberFormat('ko-KR');

export default function BorrowList({ initialItems, baseBar }) {
    const [items, setItems] = useState(initialItems);
    const [selected, setSelected] = useState(() => new Set(initialItems.map((item) => item.isbn13)));
    // 목록 쪽 안내(빼기 결과) / 하단 바 안내(동선 짜기). kind: 'done'은 스크린리더만, 'hint'·'error'는 화면에도
    const [listMessage, setListMessage] = useState(null);
    const [ctaMessage, setCtaMessage] = useState(null);
    const headingRef = useRef(null);

    const total = items.length;

    const { setCount } = useBorrowCount();
    useEffect(() => {
        setCount(total);
    }, [setCount, total]);
    const selectedItems = items.filter((item) => selected.has(item.isbn13));
    const allSelected = total > 0 && selectedItems.length === total;

    function toggleOne(isbn13) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(isbn13)) next.delete(isbn13);
            else next.add(isbn13);
            return next;
        });
        setCtaMessage(null);
    }

    function toggleAll() {
        setSelected(allSelected ? new Set() : new Set(items.map((item) => item.isbn13)));
        setCtaMessage(null);
    }

    async function remove(targets) {
        const before = items;
        const ids = new Set(targets.map((item) => item.isbn13));
        setItems((current) => current.filter((item) => !ids.has(item.isbn13)));
        setListMessage(null);
        setCtaMessage(null);
        // 누른 버튼(행)이 사라지므로 포커스를 제목으로 옮겨 키보드 위치를 잃지 않게
        headingRef.current?.focus();

        const results = await Promise.allSettled(targets.map((item) => removeFromBorrowList(item.isbn13)));
        const failed = new Set();
        let error;
        results.forEach((result, i) => {
            if (result.status === 'rejected') {
                failed.add(targets[i].isbn13);
                error ??= result.reason;
            }
        });

        if (failed.size === 0) {
            setListMessage({ kind: 'done', text: `빌릴 책에서 ${countFormat.format(targets.length)}권을 뺐어요` });
            return;
        }
        // 실패한 책만 원래 자리로 (그사이 따로 뺀 책은 그대로 둠)
        setItems((current) => before.filter((item) => failed.has(item.isbn13) || current.includes(item)));
        setListMessage({ kind: 'error', text: borrowListErrorMessage('remove', error) });
    }

    function removeSelected() {
        if (selectedItems.length === 0) {
            setListMessage({ kind: 'hint', text: '뺄 책을 먼저 선택해 주세요.' });
            return;
        }
        remove(selectedItems);
    }

    function planRoute() {
        setCtaMessage({
            kind: 'hint',
            text: selectedItems.length === 0 ? '동선을 짤 책을 선택해 주세요.' : '동선 짜기는 아직 준비 중이에요.',
        });
    }

    return (
        <>
            <header className={styles.head}>
                <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
                    빌릴 책
                    {total > 0 && (
                        <>
                            <span className={styles.count} aria-hidden="true">
                                {countFormat.format(total)}
                            </span>
                            <span className="sr-only">{`${countFormat.format(total)}권`}</span>
                        </>
                    )}
                </h1>
            </header>

            {baseBar}

            {total > 0 && (
                <div className={styles.selectBar}>
                    <label className={styles.selectAll}>
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                        {`전체 선택 (${countFormat.format(selectedItems.length)}/${countFormat.format(total)})`}
                    </label>
                    <button type="button" className={styles.textButton} onClick={removeSelected}>
                        선택한 책 빼기
                    </button>
                </div>
            )}

            <p role="status" className={listMessage && listMessage.kind !== 'done' ? styles.message : 'sr-only'}>
                {listMessage?.text}
            </p>

            {total === 0 ? (
                <div className={styles.empty}>
                    <p className={styles.emptyTitle}>빌릴 책이 비어 있어요</p>
                    <p className={styles.emptyText}>읽고 싶은 책을 검색해서 빌릴 책에 추가해 보세요.</p>
                    <Link href="/" className={styles.primary}>
                        <SearchIcon size={20} strokeWidth={2.4} />
                        책 검색
                    </Link>
                </div>
            ) : (
                <ul className={styles.list}>
                    {items.map((item) => (
                        <BorrowListRow
                            key={item.isbn13}
                            item={item}
                            checked={selected.has(item.isbn13)}
                            onToggle={() => toggleOne(item.isbn13)}
                            onRemove={() => remove([item])}
                        />
                    ))}
                </ul>
            )}

            {total > 0 && (
                <div className={styles.actions}>
                    <p role="status" className={ctaMessage ? styles.message : 'sr-only'}>
                        {ctaMessage?.text}
                    </p>
                    <button type="button" className={styles.primary} onClick={planRoute}>
                        <RouteIcon size={20} strokeWidth={2.2} />
                        {`${countFormat.format(selectedItems.length)}권으로 동선 짜기`}
                    </button>
                </div>
            )}
        </>
    );
}

// 한 행: [선택] [표지·제목·저자 = 책 상세 링크] [✕ 빼기]. 체크박스와 빼기 버튼은 링크 밖
function BorrowListRow({ item, checked, onToggle, onRemove }) {
    const cover = toHttps(item.imageUrl);

    return (
        <li className={styles.row}>
            <label className={styles.check}>
                <input type="checkbox" checked={checked} onChange={onToggle} aria-label={`${item.title} 선택`} />
            </label>

            <Link href={`/book/${item.isbn13}`} className={styles.link}>
                <span className={styles.cover}>
                    {cover && (
                        // 표지는 여러 외부 호스트라 img로 지연 로딩만. 자리는 .cover가 5:7로 잡음
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={`${item.title} 표지`} loading="lazy" decoding="async" />
                    )}
                </span>
                <span className={styles.text}>
                    <span className={styles.bookTitle}>{item.title}</span>
                    {item.authors && <span className={styles.meta}>{item.authors}</span>}
                </span>
            </Link>

            <button type="button" className={styles.remove} onClick={onRemove} aria-label={`${item.title} 빼기`}>
                <CloseIcon size={18} />
            </button>
        </li>
    );
}
