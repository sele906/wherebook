'use client';

import { useRouter } from 'next/navigation';

import { BackIcon } from './icons';

/*
 * 뒤로가기. 우리 사이트 안에서 넘어왔으면 브라우저 뒤로(검색어·스크롤 유지),
 * 바깥(검색엔진, 공유 링크)에서 바로 들어왔으면 fallback 주소로 간다.
 * JS가 없어도 href(fallback)로 동작한다.
 */
function cameFromThisSite() {
    try {
        // 앱 안에서 링크로 넘어왔으면(클라이언트 이동) 처음 연 문서 주소와 지금 주소가 다름
        const firstUrl = performance.getEntriesByType('navigation')[0]?.name;
        if (firstUrl && firstUrl !== window.location.href) return true;
        // 우리 사이트의 다른 페이지에서 새로 불러온 경우
        return Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin;
    } catch {
        return false;
    }
}

export default function BackLink({ fallback = '/', className }) {
    const router = useRouter();

    function handleClick(e) {
        if (cameFromThisSite() && window.history.length > 1) {
            e.preventDefault();
            router.back();
        }
    }

    return (
        <a href={fallback} onClick={handleClick} className={className} aria-label="뒤로">
            <BackIcon size={24} />
        </a>
    );
}
