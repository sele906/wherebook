'use client';

import Link, { useLinkStatus } from 'next/link';

/*
 * 목록 "더 보기". 주소(?page=N, 1~N페이지까지 보기)가 바뀌는 링크라 JS 없이도 동작하고,
 * 서버가 그린 HTML에 지금까지 본 도서관이 다 들어간다 (무한 스크롤과 다른 점).
 * href 끝의 #앵커는 새로 나온 첫 도서관 행 — 누르면 그 행으로 간다.
 * 미리 불러오기는 끔 (누르지 않은 다음 페이지 때문에 백엔드를 부르지 않게). 기다리는 동안 버튼 글자만 바뀐다.
 */
export default function MoreLink({ href, className }) {
    return (
        <Link href={href} prefetch={false} className={className}>
            <MoreLabel />
        </Link>
    );
}

function MoreLabel() {
    const { pending } = useLinkStatus();
    return pending ? '불러오는 중…' : '더 보기';
}
