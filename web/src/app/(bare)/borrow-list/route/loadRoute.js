import { cache } from 'react';

import { ApiError, planRoute } from '@/api';

// 결과 카드(RouteResult)와 지도(RouteMap)가 같은 응답을 쓰도록 한 요청 안에서 한 번만 부른다 (React cache).
// cache는 인자를 값으로 비교하므로 ISBN 배열 대신 쉼표로 이은 문자열을 받는다. 실패하면 null
export const loadRoute = cache(async (isbnKey, latitude, longitude, radiusKm) => {
    try {
        return await planRoute({
            isbns: isbnKey.split(','),
            latitude,
            longitude,
            radius: radiusKm * 1000,
        });
    } catch (e) {
        if (e instanceof ApiError) return null;
        throw e;
    }
});
