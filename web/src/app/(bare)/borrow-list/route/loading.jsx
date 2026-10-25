import BackLink from '@/components/BackLink';
import LibraryMapSkeleton from '@/components/map/LibraryMapSkeleton';

import RouteResultSkeleton from './RouteResultSkeleton';
import RouteSheet from './RouteSheet';
import { RouteHeadTextSkeleton } from './RouteHeadText';
import styles from './page.module.css';

/*
 * 빌릴 책에서 "N권으로 동선 짜기"를 누르는 즉시 보여줄 화면.
 * loading.jsx가 있어야 서버 응답(동선 계산은 몇 초 걸림)을 기다리지 않고 바로 화면이 바뀐다.
 * page와 같은 배치(모바일: 머리 + 지도 + 시트 / 웹: 왼쪽 패널 + 오른쪽 지도)로 자리만 잡아서
 * 진짜 화면이 와도 밀리지 않는다. 머리 글자도 page의 Suspense·반경 넓히기와 같은 막대 (RouteHeadTextSkeleton).
 * 불러오는 중 알림(role="status")은 카드 스켈레톤 한 곳만 — 지도 스켈레톤은 aria-hidden으로 감쌈.
 */
export default function RouteLoading() {
    return (
        <main className={styles.main} data-map="">
            <header className={styles.head}>
                <BackLink fallback="/borrow-list" className={styles.back} />
                <RouteHeadTextSkeleton />
            </header>

            <div className={styles.mapArea}>
                <div className={styles.map} aria-hidden="true">
                    <LibraryMapSkeleton />
                </div>
            </div>

            <RouteSheet>
                <RouteResultSkeleton />
            </RouteSheet>
        </main>
    );
}
