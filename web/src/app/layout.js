/*
 * 폰트: Noto Sans KR (가변 폰트, next/font로 빌드 때 받아서 자체 호스팅).
 * TODO: 폰트는 아직 확정 전. 바꿀 때는 아래 import 한 줄과 함수 이름만 갈아끼우면 되고,
 *       나머지는 globals.css의 --font-sans 를 통해 쓴다.
 *
 * 영어 대비:
 * - subsets: ['latin'] = 영문 조각만 미리 불러옴(preload). 한글은 unicode-range 조각으로
 *   화면에 실제로 나온 글자 범위만 받는다. 영어 화면이면 한글 조각을 아예 안 받음.
 * - adjustFontFallback(기본 true)이 폰트 도착 전 대체 폰트의 글자 폭을 맞춰서
 *   폰트가 바뀌는 순간 레이아웃이 밀리지 않게 한다.
 */
import { Noto_Sans_KR } from 'next/font/google';

import BaseCookieSync from '@/components/BaseCookieSync';

import './globals.css';

const notoSansKr = Noto_Sans_KR({
    subsets: ['latin'],
    weight: 'variable',
    display: 'swap',
    variable: '--font-noto-kr',
});

export const metadata = {
    title: '책어디 - 내 주변 도서관 책 찾기',
    description: '도서관 검색 서비스',
    // 로고 파일은 public/logo/ 에 모아둠 (원본 디자인 파일은 assets/logo/)
    icons: {
        icon: { url: '/logo/icon.svg', type: 'image/svg+xml' },
        apple: { url: '/logo/apple-icon.png', sizes: '1024x1024', type: 'image/png' },
    },
};

// 모바일 브라우저 상단 바 색을 앱 배경색(--bg)과 맞춤.
// meta 태그라 CSS 변수를 못 써서 globals.css의 --bg 값을 그대로 적음.
export const viewport = {
    viewportFit: 'cover',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#F4EEE2' },
        { media: '(prefers-color-scheme: dark)', color: '#14171F' },
    ],
};

/*
 * 저장된 테마를 그리기 전에 <html data-theme>에 넣어서 첫 화면이 깜빡이지 않게 한다.
 * 값이 없거나 'system'이면 속성을 안 넣고 시스템 설정(prefers-color-scheme)을 따른다.
 * 설정 화면에서 테마를 바꿀 때도 같은 키(THEME_STORAGE_KEY)에 저장할 것.
 */
const THEME_STORAGE_KEY = 'theme';
const themeScript = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }) {
    return (
        // data-theme은 위 스크립트가 하이드레이션 전에 넣으므로 불일치 경고를 끈다
        <html lang="ko" className={notoSansKr.variable} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body>
                {children}
                <BaseCookieSync />
            </body>
        </html>
    );
}
