import Form from 'next/form';
import Link from 'next/link';

import BrandLogo from '@/components/BrandLogo';
import { SearchIcon, GearIcon, LocateIcon, PlusIcon } from '@/components/icons';

import styles from './page.module.css';

/*
 * 목업 Main 화면.
 * 지금 실제로 붙는 건 검색 폼뿐 — /search?q= 로 넘김.
 *
 * TODO: 최근 검색어 — localStorage에 저장하고 읽어오기 (클라이언트 컴포넌트로 분리 필요)
 * TODO: 인기 대출 — 정보나루 인기대출 엔드포인트가 백엔드에 생기면 교체.
 *       지금은 목업에 있던 샘플 그대로임.
 * TODO: 표지 이미지 — book.imageUrl 붙기 전까지 --surface 색 박스로 둠
 * TODO: 인기 대출 "더보기" — 인기 대출 목록 화면이 생기면 섹션 제목 옆에 링크 추가
 */

const RECENT_KEYWORDS = ['불편한 편의점', '세이노의 가르침', '한강'];

const POPULAR_BOOKS = [
    { title: '소년이 온다', authors: '한강' },
    { title: '불편한 편의점', authors: '김호연' },
    { title: '채식주의자', authors: '한강' },
    { title: '작별하지 않는다', authors: '한강' },
    { title: '세이노의 가르침', authors: '세이노' },
    { title: '흰', authors: '한강' },
];

export default function Home() {
    return (
        <main className={styles.main}>
            {/* 모바일·태블릿 헤더. 1024px 이상에서는 SiteHeader가 대신함 */}
            <header className={styles.mobileHeader}>
                <BrandLogo size={28} />
                <span className={styles.wordmark}>책어디</span>
                <Link href="/settings" className={styles.iconLink} aria-label="설정">
                    <GearIcon size={22} />
                </Link>
            </header>

            <section className={styles.hero}>
                <h1 className={styles.headline}>
                    빌리고 싶은 책,
                    <br />
                    어느 도서관에 있을까?
                </h1>

                {/* next/form: 제출하면 새로고침 없이 이동 (JS 없으면 일반 GET 폼) */}
                <Form action="/search" role="search" className={styles.searchForm}>
                    <label htmlFor="home-q" className="sr-only">
                        책 검색
                    </label>
                    {/* 지우기(✕) 버튼은 일부러 없음 — 메인은 빈 검색창에서 시작하고, 검색 버튼 옆이 복잡해짐 */}
                    <div className={styles.searchBar}>
                        <SearchIcon size={20} />
                        <input
                            id="home-q"
                            name="q"
                            type="search"
                            placeholder="책 제목"
                            enterKeyHint="search"
                            className={styles.searchInput}
                        />
                        {/* 모바일은 아이콘만, 768px 이상은 "검색" 글자 버튼 (목업 그대로) */}
                        <button type="submit" className={styles.searchButton} aria-label="검색">
                            <SearchIcon size={20} strokeWidth={2.2} />
                            <span className={styles.searchButtonLabel} aria-hidden="true">
                                검색
                            </span>
                        </button>
                    </div>
                </Form>
            </section>

            <section className={styles.nearby} aria-labelledby="nearby-heading">
                <h2 id="nearby-heading" className={styles.nearbyTitle}>
                    내 주변 도서관
                </h2>
                <p className={styles.nearbyText}>
                    위치를 켜면 가까운 도서관의 대출 가능 여부를 먼저 보여드려요.
                </p>
                {/* TODO: 위치 권한 요청 → 클라이언트 컴포넌트로 분리 */}
                <button type="button" className={styles.locateButton}>
                    <LocateIcon size={18} />내 위치로 찾기
                </button>
            </section>

            <section className={styles.recent} aria-labelledby="recent-heading">
                <div className={styles.sectionHead}>
                    <h2 id="recent-heading" className={styles.sectionTitle}>
                        최근 검색어
                    </h2>
                    <button type="button" className={styles.textButton}>
                        전체 삭제
                    </button>
                </div>
                <div className={styles.chips}>
                    {RECENT_KEYWORDS.map((keyword) => (
                        <Link
                            key={keyword}
                            href={`/search?q=${encodeURIComponent(keyword)}`}
                            className={styles.chip}
                        >
                            <span className={styles.chipLabel}>{keyword}</span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className={styles.popular} aria-labelledby="popular-heading">
                <div className={styles.sectionHead}>
                    <h2 id="popular-heading" className={styles.sectionTitle}>
                        이번 주 인기 대출
                    </h2>
                </div>
                <ul className={styles.bookRow}>
                    {POPULAR_BOOKS.map((book) => (
                        <li key={book.title} className={styles.bookCard}>
                            <div className={styles.cover}>
                                {/* TODO: 빌릴 책에 추가 → 빌릴 책 API(/api/borrow-list) 붙일 때 연결 */}
                                <button
                                    type="button"
                                    className={styles.addButton}
                                    aria-label={`${book.title} 빌릴 책에 추가`}
                                >
                                    <PlusIcon size={20} strokeWidth={2.2} />
                                </button>
                            </div>
                            <span className={styles.bookTitle}>{book.title}</span>
                            <span className={styles.bookAuthors}>{book.authors}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    );
}
