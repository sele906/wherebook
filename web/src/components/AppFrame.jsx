import SiteHeader from './SiteHeader';
import TabBar from './TabBar';
import styles from './AppFrame.module.css';

/*
 * 모든 화면이 공유하는 바깥 틀.
 * - 1024px 미만(모바일·태블릿): 본문 + 하단 탭바 (SiteHeader는 CSS로 숨김)
 * - 1024px 이상(웹): 상단 헤더 + 본문 (TabBar는 CSS로 숨김)
 * 스크롤은 본문 영역만 되고 틀 자체는 100dvh에 고정됨.
 *
 * nav={false}로 주면 모바일에서 탭바 없는 전체 화면이 됨
 * (목업의 책 상세 / 동선 추천 / 설정처럼 뒤로가기 헤더를 쓰는 화면들).
 * 본문 가로 폭(목업 웹 기준 1120px)은 화면마다 달라서 각 page에서 잡음.
 */
export default function AppFrame({ children, nav = true }) {
    return (
        <div className={styles.frame}>
            <SiteHeader />

            <div className={styles.scroll}>
                <div className={styles.content}>{children}</div>
            </div>

            {nav && <TabBar />}
        </div>
    );
}
