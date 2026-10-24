import OpenLocationButton from '@/components/location/OpenLocationButton';
import { LocateIcon } from '@/components/icons';
import { getBase } from '@/lib/base';
import { getMyBorrowList } from '@/lib/borrowList';
import { DEFAULT_RADIUS_KM, describeBase } from '@/lib/location';

import BorrowList from './BorrowList';
import styles from './page.module.css';

/*
 * 빌릴 책 — /borrow-list
 * 빌리러 갈 책을 모아 두고 동선을 짜는 곳. 대출 자체는 도서관에서 한다 (앱은 대출하지 않음).
 * 이름은 층마다 같은 뿌리를 쓴다: 화면 "빌릴 책" / 주소 /borrow-list / API /api/borrow-list / 테이블 borrow_list_item.
 *
 * 목록은 서버가 게스트 쿠키로 받아서 처음부터 HTML에 그린다 (깜빡임 없음). 빼기·선택은 BorrowList(클라이언트).
 * TODO: 책마다 "반경 안 N곳에서 대출 가능" — 정보나루 호출이 책 수 × 도서관 수라서 보류.
 *       동선 API를 만들 때 백엔드가 한 번에 계산해서 주는 쪽으로.
 * TODO: 반경 고르기 — 동선 짜기가 생기면 반경이 의미가 생김. 지금은 기본 반경만 글자로 보여줌.
 */
export const metadata = {
    title: '빌릴 책 | 책어디',
    // 사람마다 다른 개인 목록이라 색인하지 않음
    robots: { index: false, follow: false },
};

export default async function BorrowListPage() {
    const [items, base] = await Promise.all([getMyBorrowList(), getBase()]);

    if (!items) {
        return (
            <main className={styles.main}>
                <h1 className={styles.title}>빌릴 책</h1>
                <div className={styles.notice}>
                    <p className={styles.noticeTitle}>빌릴 책을 불러오지 못했어요</p>
                    {/* 같은 주소를 새로 불러오도록 <a> (JS 없이도 동작) */}
                    <a href="/borrow-list" className={styles.secondary}>
                        다시 시도
                    </a>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <BorrowList
                initialItems={items}
                baseBar={
                    // 기준 위치는 항상 글자로
                    <div className={styles.baseBar}>
                        <LocateIcon size={18} className={styles.baseIcon} />
                        <p className={styles.baseText}>{describeBase(base, DEFAULT_RADIUS_KM)}</p>
                        <OpenLocationButton className={styles.baseChange}>
                            <span className="sr-only">기준 위치 </span>바꾸기
                        </OpenLocationButton>
                    </div>
                }
            />
        </main>
    );
}
