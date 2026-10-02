import AppFrame from '@/components/AppFrame';

/*
 * (shell) 그룹 = 하단 탭바(모바일) / 상단 헤더(PC)를 쓰는 화면들.
 * 괄호 폴더라 URL에는 안 나옴 — (shell)/search/page.jsx 는 그대로 /search.
 *
 * 책 상세처럼 탭바 없이 뒤로가기 헤더만 쓰는 화면은 형제 그룹 (bare) 에 둔다.
 */
export default function ShellLayout({ children }) {
    return <AppFrame>{children}</AppFrame>;
}
