import Link from 'next/link';

import BrandLogo from './BrandLogo';
import { BagIcon, PinIcon, GearIcon } from './icons';
import styles from './SiteHeader.module.css';

/*
 * 태블릿/PC 상단 헤더. 600px 미만에서는 CSS로 숨기고 TabBar가 대신 뜸.
 * 목업 웹 헤더에는 활성 표시가 없어서 현재 경로를 볼 필요가 없음 → 서버 컴포넌트.
 *
 * TODO: TabBar와 마찬가지로 대출가방 권수 뱃지는 상태 붙일 때 추가.
 */
export default function SiteHeader() {
    return (
        <header className={styles.header}>
            <Link href="/" className={styles.brand}>
                <BrandLogo size={30} />
                책어디
            </Link>

            <nav className={styles.nav} aria-label="주 메뉴">
                <Link href="/libraries" className={styles.navLink}>
                    <PinIcon size={20} />
                    내 주변
                </Link>
                <Link href="/bag" className={styles.navLink}>
                    <BagIcon size={20} />
                    대출가방
                </Link>
                <Link href="/settings" className={styles.iconLink} aria-label="설정">
                    <GearIcon size={22} />
                </Link>
            </nav>
        </header>
    );
}
