import { cookies } from 'next/headers';
import { cache } from 'react';

import { ApiError, getBorrowList, GUEST_COOKIE } from '@/api';

/*
 * 서버 전용: 지금 요청한 사람의 빌릴 책 목록.
 * 게스트 쿠키는 백엔드로 전달만 하고, 값은 화면(클라이언트)으로 넘기지 않는다.
 * 쿠키가 없으면(처음 온 사람·크롤러) 백엔드를 부르지 않고 []. 조회에 실패하면 null.
 * cookies()를 쓰므로 부르는 화면은 요청마다 렌더링된다.
 * cache: 한 요청 안에서 레이아웃(배지)과 페이지(검색 결과 등)가 같이 불러도 백엔드는 한 번만 부른다.
 */
export const getMyBorrowList = cache(async function getMyBorrowList() {
    const guest = (await cookies()).get(GUEST_COOKIE);
    if (!guest) return [];

    try {
        return await getBorrowList({ headers: { cookie: `${GUEST_COOKIE}=${guest.value}` } });
    } catch (e) {
        if (e instanceof ApiError) return null;
        throw e;
    }
});
