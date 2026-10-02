/*
 * 빌릴 책 — /borrow-list
 * 빌리러 갈 책을 모아 두고 동선을 짜는 곳. 대출 자체는 도서관에서 한다 (앱은 대출하지 않음).
 * 이름은 층마다 같은 뿌리를 쓴다: 화면 "빌릴 책" / 주소 /borrow-list / API /api/borrow-list / 테이블 borrow_list_item.
 *
 * TODO: 목업 Bag(위치·반경 바 / 추가한 책 목록 / "N권으로 동선 짜기" CTA)으로 채우기.
 *       지금은 탭바 링크가 죽지 않게 두는 자리표시자.
 */
export const metadata = {
    title: '빌릴 책 | 책어디',
    // 사람마다 다른 개인 목록이라 색인하지 않음
    robots: { index: false, follow: false },
};

export default function BorrowListPage() {
    return (
        <main>
            <h1>빌릴 책</h1>
            <p>빌릴 책에 추가한 책이 없어요.</p>
        </main>
    );
}
