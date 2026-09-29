'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SearchIcon, BagIcon, PinIcon } from './icons';
import styles from './TabBar.module.css';

/*
 * 모바일 하단 탭바. 목업의 3탭 구조(검색 / 대출가방 / 내 주변) 그대로.
 * 600px 이상에서는 CSS로 숨기고 SiteHeader가 대신 뜸.
 *
 * TODO: 목업에는 대출가방 아이콘에 담긴 권수 뱃지가 붙어 있음.
 *       대출가방 상태(전역 스토어)가 생기면 그때 뱃지 추가.
 */

// match: 이 경로들 아래에 있으면 해당 탭을 활성으로 봄
const TABS = [
    { href: '/', label: '검색', Icon: SearchIcon, match: ['/', '/books'] },
    { href: '/bag', label: '대출가방', Icon: BagIcon, match: ['/bag'] },
    { href: '/libraries', label: '내 주변', Icon: PinIcon, match: ['/libraries'] },
];

function isActive(pathname, match) {
    return match.some((path) =>
        path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`)
    );
}

export default function TabBar() {
    const pathname = usePathname();

    return (
        <nav className={styles.tabbar} aria-label="주 메뉴">
            {TABS.map(({ href, label, Icon, match }) => {
                const active = isActive(pathname, match);

                return (
                    <Link
                        key={href}
                        href={href}
                        className={styles.tab}
                        aria-current={active ? 'page' : undefined}
                    >
                        <Icon size={24} strokeWidth={active ? 2.2 : 2} />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
