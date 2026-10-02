import Link from 'next/link';

import BrandLogo from './BrandLogo';
import NavLink from './NavLink';
import { BorrowListIcon, PinIcon, GearIcon } from './icons';
import styles from './SiteHeader.module.css';

/*
 * 웹(1024px 이상) 상단 헤더. 1024px 미만에서는 CSS로 숨기고 TabBar가 대신 뜬다.
 * 검색은 로고(홈)로 간다 — 목업 웹 헤더 구성 그대로.
 *
 * TODO: 빌릴 책 권수 배지 (0이면 숨김). 빌릴 책 API(/api/borrow-list) 붙일 때 추가.
 */
export default function SiteHeader() {
    return (
        <header className={styles.header}>
            <Link href="/" className={styles.brand}>
                <BrandLogo size={30} />
                <span className={styles.wordmark}>책어디</span>
            </Link>

            <nav className={styles.nav} aria-label="주 메뉴">
                <NavLink href="/libraries" className={styles.navLink}>
                    <PinIcon size={20} />
                    <span className={styles.navLabel}>내 주변</span>
                </NavLink>
                <NavLink href="/borrow-list" className={styles.navLink}>
                    <BorrowListIcon size={20} />
                    <span className={styles.navLabel}>빌릴 책</span>
                </NavLink>
                <NavLink href="/settings" className={styles.iconLink} aria-label="설정">
                    <GearIcon size={22} />
                </NavLink>
            </nav>
        </header>
    );
}
