import LocationChip from '@/components/location/LocationChip';

import styles from './page.module.css';

// 제목 + (모바일·태블릿) 기준 위치 칩. page·loading이 같이 써서 칩 자리가 밀리지 않게
export default function TitleRow() {
    return (
        <div className={styles.titleRow}>
            <h1 className={styles.title}>내 주변</h1>
            <LocationChip className={styles.locationChip} />
        </div>
    );
}
