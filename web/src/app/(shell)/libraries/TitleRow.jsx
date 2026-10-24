import LocationTitle from '@/components/location/LocationTitle';
import { LoadingArea, Skeleton } from '@/components/Skeleton';

import { ViewToggle } from './NearbyView';
import styles from './page.module.css';

/*
 * 내 주변 제목 줄 — 모바일·웹, 목록·지도 보기 모두 같은 모양 하나로 둔다 (보기마다 다르게 만들지 않음).
 *   [작은 "내 주변"            ]  [지도 | 목록]
 *   [[핀] 위치 이름 ▾ (큰 글자)]
 * 왼쪽: 작은 화면 이름(h1)을 위치 제목 위에 얹고, 위치 제목을 누르면 기준 위치 고르기 창.
 * 오른쪽: 보기 토글. 웹은 목록·지도가 같이 나와서 CSS로 숨김.
 * page·loading이 같이 써서 제목 자리가 밀리지 않게. loading은 base를 몰라서 위치 자리만 잡는다.
 */
export default function TitleRow({ base }) {
    return (
        <div className={styles.titleRow}>
            <div className={styles.titleText}>
                <h1 className={styles.title}>내 주변</h1>
                {base ? (
                    <LocationTitle base={base} size="lg" />
                ) : (
                    <LoadingArea className={styles.locationSkeleton}>
                        <Skeleton width="9rem" height="var(--text-xl)" />
                    </LoadingArea>
                )}
            </div>
            <ViewToggle />
        </div>
    );
}
