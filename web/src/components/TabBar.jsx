import NavLink from './NavLink';
import { SearchIcon, BagIcon, PinIcon } from './icons';
import styles from './TabBar.module.css';

/*
 * 모바일·태블릿(1024px 미만) 하단 탭바. 검색 / 대출가방 / 내 주변, 대출가방이 가운데.
 * 1024px 이상에서는 CSS로 숨기고 SiteHeader가 대신 뜬다.
 * 활성 표시는 NavLink가 aria-current로 붙이고, 색·굵기는 CSS가 맡는다.
 *
 * TODO: 대출가방 탭에 담은 권수 배지 (0이면 숨김). 대출가방 API 붙일 때 추가.
 */

// match: 이 경로들 아래에 있으면 해당 탭을 활성으로 봄
const TABS = [
    { href: '/', label: '검색', Icon: SearchIcon, match: ['/', '/books'] },
    { href: '/bag', label: '대출가방', Icon: BagIcon, match: ['/bag'] },
    { href: '/libraries', label: '내 주변', Icon: PinIcon, match: ['/libraries'] },
];

export default function TabBar() {
    return (
        <nav className={styles.tabbar} aria-label="주 메뉴">
            {TABS.map(({ href, label, Icon, match }) => (
                <NavLink key={href} href={href} match={match} className={styles.tab}>
                    <Icon size={24} />
                    <span className={styles.label}>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
