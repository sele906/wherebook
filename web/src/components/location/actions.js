'use server';

import { searchPlaces } from '@/api';

const QUERY_MAX = 40;

/*
 * 기준 위치 고르기의 장소 검색. 백엔드 API 주소가 서버에만 있어서 Server Function으로 부른다.
 * 누구나 POST로 직접 부를 수 있으므로 입력을 검사한다.
 */
export async function findPlaces(query) {
    if (typeof query !== 'string') throw new Error('잘못된 검색어');
    const q = query.trim().slice(0, QUERY_MAX);
    if (!q) return [];
    return searchPlaces(q);
}
