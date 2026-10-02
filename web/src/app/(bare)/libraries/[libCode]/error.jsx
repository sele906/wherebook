'use client';

import RouteError from '@/components/RouteError';

// 도서관 정보를 못 불러왔을 때 (백엔드 장애 등). 없는 도서관 코드는 404(not-found)로 따로 감.
export default function LibraryError({ retry }) {
    return <RouteError title="도서관 정보를 불러오지 못했어요" retry={retry} />;
}
