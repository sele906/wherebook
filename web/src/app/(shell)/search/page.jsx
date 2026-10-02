import { Suspense } from 'react';
import Link from 'next/link';

import { ApiError, searchBooks } from '@/api';
import BookRow from '@/components/BookRow';
import Pager, { readPage } from '@/components/Pager';
import { PendingForm, PendingNavProvider, PendingSwap } from '@/components/PendingNav';
import SearchField from '@/components/SearchField';
import { BackIcon } from '@/components/icons';

import ResultsSkeleton from './ResultsSkeleton';
import styles from './page.module.css';

/*
 * 책 검색 결과 — /search?q=검색어&page=2
 * 검색 결과는 색인하지 않는다(noindex). 대신 링크(follow)는 따라가게 해서 책 상세가 수집되게 함.
 * 검색창은 바로 그리고, 결과 목록만 Suspense로 나중에 채운다.
 *
 * TODO: 정렬(정확도순 등) — 백엔드 /api/books 에 정렬 파라미터가 생기면 결과 수 옆에 추가.
 * TODO: 지금 백엔드는 제목 검색만 됨. 저자·ISBN 검색이 생기면 placeholder도 같이 바꿀 것.
 */

const PAGE_SIZE = 20;
const numberFormat = new Intl.NumberFormat('ko-KR');

function readQuery(value) {
    const raw = Array.isArray(value) ? value[0] : value;
    return (raw ?? '').trim();
}

function searchHref(q, page) {
    const params = new URLSearchParams({ q });
    if (page > 1) params.set('page', String(page));
    return `/search?${params}`;
}

export async function generateMetadata({ searchParams }) {
    const q = readQuery((await searchParams).q);

    return {
        title: q ? `‘${q}’ 검색 결과 - 책어디` : '책 검색 - 책어디',
        robots: { index: false, follow: true },
    };
}

export default async function SearchPage({ searchParams }) {
    const params = await searchParams;
    const q = readQuery(params.q);
    const page = readPage(params.page);

    return (
        <main className={styles.main}>
            {/* 검색·페이지 이동을 누르는 즉시 결과 자리를 스켈레톤으로 (PendingNav 설명 참고) */}
            <PendingNavProvider>
                <PendingForm action="/search" role="search" className={styles.bar}>
                    <Link href="/" className={styles.back} aria-label="검색 처음 화면으로">
                        <BackIcon size={24} />
                    </Link>
                    {/* key: 검색어가 바뀌면 입력창 초기값을 다시 받음 */}
                    <SearchField key={q} id="search-q" name="q" label="책 검색" defaultValue={q} placeholder="책 제목" />
                </PendingForm>

                <h1 className="sr-only">{q ? `‘${q}’ 검색 결과` : '책 검색'}</h1>

                <PendingSwap fallback={<ResultsSkeleton />}>
                    {q ? (
                        <Suspense key={`${q}:${page}`} fallback={<ResultsSkeleton />}>
                            <Results q={q} page={page} />
                        </Suspense>
                    ) : (
                        <Message
                            title="찾고 싶은 책 제목을 입력해 주세요"
                            text="책 제목으로 검색하면 어느 도서관에 있는지 알려드려요."
                        />
                    )}
                </PendingSwap>
            </PendingNavProvider>
        </main>
    );
}

async function Results({ q, page }) {
    let data = null;
    try {
        data = await searchBooks({ title: q, pageNo: page, pageSize: PAGE_SIZE });
    } catch (e) {
        if (!(e instanceof ApiError)) throw e;
    }

    if (!data) {
        return (
            <Message
                title="책 정보를 불러오지 못했어요"
                text="잠시 후 다시 시도해 주세요."
                // 같은 주소를 새로 불러오도록 <a> (JS 없이도 동작)
                action={
                    <a href={searchHref(q, page)} className={styles.action}>
                        다시 시도
                    </a>
                }
            />
        );
    }

    const books = data.books ?? [];
    const totalCount = data.totalCount ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    if (totalCount === 0) {
        return <Message title={`‘${q}’에 맞는 책을 찾지 못했어요`} text="띄어쓰기를 바꾸거나 제목의 일부만 넣어 검색해 보세요." />;
    }

    // 있는 페이지보다 큰 page로 들어온 경우
    if (books.length === 0) {
        return (
            <Message
                title="이 페이지에는 결과가 없어요"
                action={
                    <Link href={searchHref(q, 1)} className={styles.action}>
                        첫 페이지로 가기
                    </Link>
                }
            />
        );
    }

    return (
        <>
            <p className={styles.count}>
                결과 <strong>{numberFormat.format(totalCount)}</strong>건
            </p>

            <ul className={styles.list}>
                {books.map((book) => (
                    <BookRow key={book.isbn13} book={book} />
                ))}
            </ul>

            <Pager
                page={page}
                totalPages={totalPages}
                hrefFor={(p) => searchHref(q, p)}
                label="검색 결과 페이지"
            />
        </>
    );
}

function Message({ title, text, action }) {
    return (
        <div className={styles.message}>
            <p className={styles.messageTitle}>{title}</p>
            {text && <p className={styles.messageText}>{text}</p>}
            {action}
        </div>
    );
}
