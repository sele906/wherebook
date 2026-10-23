import LocationTitle from '@/components/location/LocationTitle';
import { LoadingArea, Skeleton } from '@/components/Skeleton';

import styles from './page.module.css';

/*
 * 작은 "내 주변" + 큰 "[핀] 위치 이름 ▾" (누르면 기준 위치 고르기 창).
 * page·loading이 같이 써서 제목 자리가 밀리지 않게. loading은 base를 몰라서 자리만 잡는다.
 */
export default function TitleRow({ base }) {
    return (
        <div className={styles.titleRow}>
            <h1 className={styles.title}>내 주변</h1>
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
