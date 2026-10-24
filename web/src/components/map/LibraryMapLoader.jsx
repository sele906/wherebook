'use client';

import dynamic from 'next/dynamic';

import LibraryMapSkeleton from './LibraryMapSkeleton';

/*
 * 지도는 클라이언트 전용 (CLAUDE.md). 카카오맵 SDK는 서버에서 렌더링하지 않고 브라우저에서만 불러온다.
 * ssr: false는 서버 컴포넌트에서 못 쓰므로 이 작은 클라이언트 컴포넌트를 거친다.
 */
const LibraryMap = dynamic(() => import('./LibraryMap'), {
    ssr: false,
    loading: () => <LibraryMapSkeleton />,
});

export default function LibraryMapLoader(props) {
    return <LibraryMap {...props} />;
}
