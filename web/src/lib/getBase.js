import { cookies } from 'next/headers';

import { BASE_COOKIE, parseBaseCookie } from './baseCookie';
import { DEFAULT_BASE } from './location';

/*
 * 서버 컴포넌트에서 쓰는 기준 위치 { label, latitude, longitude }. (서버 전용: next/headers)
 * 쿠키가 없거나(첫 방문·검색로봇) 깨졌으면 서울 시청(DEFAULT_BASE).
 * cookies()를 읽으므로 이 함수를 부르는 화면은 요청마다 렌더링된다.
 */
export async function getBase() {
    const cookieStore = await cookies();
    const base = parseBaseCookie(cookieStore.get(BASE_COOKIE)?.value);

    if (base?.source === 'address') {
        return { label: base.label, latitude: base.latitude, longitude: base.longitude };
    }

    // TODO: GPS 기준 — 서버는 좌표를 모르므로 위치 없이 렌더링하고 거리는 클라이언트에서 계산한다.
    //       GPS를 구현하기 전까지는 기본값으로 그린다.
    return DEFAULT_BASE;
}
