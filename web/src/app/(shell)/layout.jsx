import AppFrame from '@/components/AppFrame';

/*
 * (shell) 그룹 = 하단 탭바(모바일) / 상단 헤더(PC)를 쓰는 화면들.
 * 괄호 폴더라 URL에는 안 나옴 — (shell)/books/page.jsx 는 그대로 /books.
 *
 * 목업의 책 상세 / 동선 추천 / 설정처럼 탭바 없이 뒤로가기 헤더만 쓰는 화면은
 * 나중에 (bare) 그룹을 형제로 만들어서 <AppFrame nav={false}>로 감싸면 됨.
 */
export default function ShellLayout({ children }) {
    return <AppFrame>{children}</AppFrame>;
}
