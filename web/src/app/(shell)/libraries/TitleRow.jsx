import LocationTitle from '@/components/location/LocationTitle';
import { LoadingArea, Skeleton } from '@/components/Skeleton';

import { ViewToggle } from './NearbyView';
import styles from './page.module.css';

/*
 * 작은 "내 주변" [지도|목록] + 큰 "[핀] 위치 이름 ▾" (누르면 기준 위치 고르기 창).
 * 토글은 모바일에서만 보임 (웹은 목록·지도가 같이 나옴).
 * page·loading이 같이 써서 제목 자리가 밀리지 않게. loading은 base를 몰라서 자리만 잡는다.
 */
export default function TitleRow({ base }) {
    return (
        <div className={styles.titleRow}>
            <div className={styles.titleTop}>
                <h1 className={styles.title}>내 주변</h1>
                <ViewToggle />
            </div>
            <div className={styles.titleLocation}>
                {base ? (
                    <LocationTitle base={base} size="lg" />
                ) : (
                    <LoadingArea className={styles.locationSkeleton}>
                        <Skeleton width="9rem" height="var(--text-xl)" />
                    </LoadingArea>
                )}
            </div>
        </div>
    );
}
