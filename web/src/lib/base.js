import { cookies } from 'next/headers';

import { BASE_COOKIE, DEFAULT_BASE, parseBaseCookie } from './location';

/*
 * 서버 전용: 요청 쿠키에서 지금 쓰는 기준 위치를 읽는다. 없거나 틀리면 DEFAULT_BASE.
 * 쿠키는 브라우저(lib/locationStore.js)가 localStorage를 보고 써 둔다.
 * cookies()를 쓰므로 부르는 화면은 요청마다 렌더링된다.
 */
export async function getBase() {
    const store = await cookies();
    return parseBaseCookie(store.get(BASE_COOKIE)?.value) ?? DEFAULT_BASE;
}
