import { DEFAULT_RADIUS_KM } from '@/lib/location';

import { BorrowCountBadge } from './BorrowCountProvider';
import NavLink from './NavLink';
import { SearchIcon, BorrowListIcon, PinIcon } from './icons';
import styles from './TabBar.module.css';

/*
 * 모바일·태블릿(1024px 미만) 하단 탭바. 검색 / 빌릴 책 / 내 주변, 빌릴 책이 가운데.
 * 1024px 이상에서는 CSS로 숨기고 SiteHeader가 대신 뜬다.
 * 활성 표시는 NavLink가 aria-current로 붙이고, 색·굵기는 CSS가 맡는다.
 * 빌릴 책 탭에는 추가한 권수 배지 (0이면 숨김, BorrowCountBadge).
 */

// match: 이 경로들 아래에 있으면 해당 탭을 활성으로 봄
const TABS = [
    { href: '/', label: '검색', Icon: SearchIcon, match: ['/', '/search'] },
    { href: '/borrow-list', label: '빌릴 책', Icon: BorrowListIcon, match: ['/borrow-list'], badge: true },
    { href: `/libraries?r=${DEFAULT_RADIUS_KM}`, label: '내 주변', Icon: PinIcon, match: ['/libraries'] },
];

export default function TabBar() {
    return (
        <nav className={styles.tabbar} aria-label="주 메뉴">
            {TABS.map(({ href, label, Icon, match, badge }) => (
                <NavLink key={href} href={href} match={match} className={styles.tab}>
                    {/* 배지는 아이콘 오른쪽 위에 겹쳐서 라벨 폭에 영향 없음 */}
                    <span className={styles.icon}>
                        <Icon size={24} />
                        {badge && <BorrowCountBadge className={styles.badge} />}
                    </span>
                    <span className={styles.label}>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
