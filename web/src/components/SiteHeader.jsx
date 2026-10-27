import Link from 'next/link';

import { DEFAULT_RADIUS_KM } from '@/lib/location';

import { BorrowCountBadge } from './BorrowCountProvider';
import BrandLogo from './BrandLogo';
import NavLink from './NavLink';
import { BorrowListIcon, PinIcon, GearIcon } from './icons';
import styles from './SiteHeader.module.css';

/*
 * 웹(1024px 이상) 상단 헤더. 1024px 미만에서는 CSS로 숨기고 TabBar가 대신 뜬다.
 * 검색은 로고(홈)로 간다 — 목업 웹 헤더 구성 그대로.
 * 기준 위치는 헤더에 두지 않고 메인 카드·내 주변 화면 제목에서 보여준다 (LocationTitle).
 * 빌릴 책 옆에는 추가한 권수 배지 (0이면 숨김, BorrowCountBadge).
 */
export default function SiteHeader() {
    return (
        <header className={styles.header}>
            <Link href="/" className={styles.brand}>
                <BrandLogo size={30} />
                <span className={styles.wordmark}>책어디</span>
            </Link>

            <nav className={styles.nav} aria-label="주 메뉴">
                {/* href에 반경이 붙어서, 활성 판단은 경로(match)로 */}
                <NavLink href={`/libraries?r=${DEFAULT_RADIUS_KM}`} match={['/libraries']} className={styles.navLink}>
                    <PinIcon size={20} />
                    <span className={styles.navLabel}>내 주변</span>
                </NavLink>
                <NavLink href="/borrow-list" className={styles.navLink}>
                    <BorrowListIcon size={20} />
                    <span className={styles.navLabel}>빌릴 책</span>
                    <BorrowCountBadge className={styles.badge} />
                </NavLink>
                <NavLink href="/settings" className={styles.iconLink} aria-label="설정">
                    <GearIcon size={22} />
                </NavLink>
            </nav>
        </header>
    );
}
