'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { syncBaseCookie } from '@/lib/locationStore';

/*
 * 화면에 아무것도 그리지 않는다. 페이지를 열 때 localStorage의 기준 위치를 쿠키에 옮겨 적고,
 * 쿠키가 바뀌었을 때만 서버 화면을 새 기준으로 다시 그린다 (첫 방문이거나 다른 탭에서 바꾼 경우).
 * 쿠키가 이미 같으면 아무 일도 하지 않는다.
 */
export default function BaseCookieSync() {
    const router = useRouter();

    useEffect(() => {
        if (syncBaseCookie()) router.refresh();
    }, [router]);

    return null;
}
