'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/*
 * 현재 경로면 aria-current="page"를 붙이는 링크. 활성 스타일은 쓰는 쪽 CSS에서
 * [aria-current='page'] 로 잡는다. 현재 경로가 필요한 부분만 클라이언트로 떼어낸 것.
 *
 * match: 이 경로들 아래에 있으면 활성으로 본다. 없으면 href 하나만 본다.
 */
function isActive(pathname, match) {
    return match.some((path) =>
        path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`)
    );
}

export default function NavLink({ href, match = [href], children, ...rest }) {
    const pathname = usePathname();
    const active = isActive(pathname, match);

    return (
        <Link href={href} aria-current={active ? 'page' : undefined} {...rest}>
            {children}
        </Link>
    );
}
