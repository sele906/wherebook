/*
 * Pretendard Variable — 한국어 UI용으로 설계된 폰트.
 *
 * next/font/google에는 없어서 npm 패키지(OFL-1.1)를 셀프 호스팅함.
 * 단일 variable 파일은 2MB라 안 쓰고, unicode-range로 92조각 쪼개진
 * dynamic-subset을 씀 — 브라우저가 화면에 실제로 쓰인 글자 범위만 내려받음.
 *
 * TODO: 제목/디스플레이용으로 IBM Plex Sans 같은 서체를 나중에 추가.
 *       그때는 next/font/google로 불러와서 --font-display 변수에 걸고
 *       globals.css에서 제목 계열에만 적용하면 됨.
 */
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';

import './globals.css';

export const metadata = {
    title: '책어디 - 내 주변 도서관 책 찾기',
    description: '도서관 검색 서비스',
};

// 모바일 브라우저 상단 바 색을 앱 배경색(--bg)과 맞춤
export const viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#F4EEE2' },
        { media: '(prefers-color-scheme: dark)', color: '#14171F' },
    ],
};

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
            <body>{children}</body>
        </html>
    );
}
