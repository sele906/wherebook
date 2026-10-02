import { NextResponse } from 'next/server';

import { isValidIsbn13, isValidLibCode } from '@/lib/ids';

/*
 * 형식이 틀린 상세 주소는 렌더링 전에 진짜 404로.
 *
 * 상세 페이지는 loading.jsx 때문에 응답이 200으로 먼저 나가기 시작해서, 페이지 안에서 notFound()를
 * 부르면 "200 + noindex"(소프트 404)가 된다. 형식만 보면 되는 경우는 여기서 걸러 상태 코드까지 404로.
 * 백엔드는 부르지 않는다 (빠르게 끝나야 함). 형식은 맞지만 없는 책·도서관은 여전히 소프트 404.
 */
export const config = {
    matcher: ['/book/:isbn13', '/libraries/:libCode'],
};

export function proxy(request) {
    const [, section, rawId = ''] = request.nextUrl.pathname.split('/');
    const id = decodeURIComponent(rawId);
    const valid = section === 'book' ? isValidIsbn13(id) : isValidLibCode(id);

    if (!valid) {
        // 없는 경로로 돌려서 Next의 404 페이지 + 404 상태 코드
        return NextResponse.rewrite(new URL('/_invalid-id', request.url));
    }
}
