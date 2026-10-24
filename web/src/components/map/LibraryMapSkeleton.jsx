import styles from './LibraryMap.module.css';

// 지도와 같은 크기의 자리 (불러오는 동안 목록이 밀리지 않게).
// LibraryMap과 파일을 나눈 이유: 로더가 이걸 불러올 때 지도 SDK까지 같이 딸려 오지 않게
export default function LibraryMapSkeleton() {
    return (
        <div className={`${styles.frame} ${styles.skeleton}`} role="status">
            <span className="sr-only">지도를 불러오고 있어요</span>
        </div>
    );
}
