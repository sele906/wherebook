'use server';

import { getCoordinates, isAddressKey, searchPlaces } from '@/api';
import { PLACE_QUERY_MIN } from '@/lib/location';

const QUERY_MAX = 40;

/*
 * 기준 위치 고르기의 주소 검색·좌표. 백엔드 API 주소가 서버에만 있어서 Server Function으로 부른다.
 * 누구나 POST로 직접 부를 수 있으므로 입력을 검사한다.
 */
export async function findPlaces(query) {
    if (typeof query !== 'string') throw new Error('잘못된 검색어');
    const q = query.trim().slice(0, QUERY_MAX);
    if (q.length < PLACE_QUERY_MIN) return [];
    return searchPlaces(q);
}

// 검색 결과에서 고른 주소 하나의 좌표. 모르면 null
export async function locatePlace(key) {
    if (!isAddressKey(key)) throw new Error('잘못된 주소');
    const { admCd, rnMgtSn, udrtYn, buldMnnm, buldSlno } = key;
    return getCoordinates({ admCd, rnMgtSn, udrtYn, buldMnnm, buldSlno });
}
