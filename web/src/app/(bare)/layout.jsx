import AppFrame from '@/components/AppFrame';

/*
 * (bare) 그룹 = 하단 탭바 없이 뒤로가기 헤더를 쓰는 깊은 화면들 (책 상세 등).
 * 웹(1024px~)에서는 (shell)과 똑같이 상단 SiteHeader가 뜬다.
 */
export default function BareLayout({ children }) {
    return <AppFrame nav={false}>{children}</AppFrame>;
}
