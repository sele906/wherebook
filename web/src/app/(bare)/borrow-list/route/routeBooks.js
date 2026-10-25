// 동선 화면의 책 표시용 도움 함수. 책 정보는 /api/route 응답의 BookSummary 그대로

// 부제 빼고 본 제목만: "소년이 온다 :한강 장편소설" → "소년이 온다", "채식주의자:한강 연작소설" → "채식주의자".
// 콜론 앞에 공백이 없는 데이터도 있어서 첫 ":" 앞까지. 남는 게 없으면 원래 제목, 제목이 없으면 ISBN
export function shortTitle(book) {
    if (!book.title) return book.isbn13;
    return book.title.split(':')[0].trim() || book.title;
}

// "창비 2014" — 없는 값은 빼고. 둘 다 없으면 빈 문자열
export function bookMeta(book) {
    return [book.publisher, book.publicationYear].filter(Boolean).join(' ');
}
