'use server';

import { getPlaceCoord, searchPlaces } from '@/api';
import { PLACE_QUERY_MAX } from '@/lib/location';

/*
 * 기준 위치 고르기의 장소 검색·좌표. 백엔드 API 주소가 서버에만 있어서 Server Function으로 부른다.
 * 누구나 POST로 직접 부를 수 있으므로 입력을 검사한다.
 */
export async function findPlaces(query) {
    if (typeof query !== 'string') throw new Error('잘못된 검색어');
    const q = query.trim();
    if (!q) return [];
    if (q.length > PLACE_QUERY_MAX) throw new Error('잘못된 검색어');
    return searchPlaces(q);
}

// 검색 결과에서 고른 장소 { name, address } → { name, address, latitude, longitude }. 모르면 null
export async function locatePlace(place) {
    const name = typeof place?.name === 'string' ? place.name.trim() : '';
    const address = typeof place?.address === 'string' ? place.address.trim() : '';
    if (!name || !address || name.length > PLACE_QUERY_MAX || address.length > PLACE_QUERY_MAX) {
        throw new Error('잘못된 장소');
    }
    return getPlaceCoord(name, address);
}
