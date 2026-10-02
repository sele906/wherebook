'use client';

import RouteError from '@/components/RouteError';

// 책 정보를 못 불러왔을 때 (백엔드 장애 등). 없는 ISBN은 404(not-found)로 따로 감.
export default function BookError({ retry }) {
    return <RouteError title="책 정보를 불러오지 못했어요" retry={retry} />;
}
