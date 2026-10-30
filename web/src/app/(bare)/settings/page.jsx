import BackLink from '@/components/BackLink';
import { NextIcon, PinIcon } from '@/components/icons';
import OpenLocationButton from '@/components/location/OpenLocationButton';
import { getBase } from '@/lib/base';

import ThemeSetting from './ThemeSetting';
import styles from './page.module.css';

/*
 * 설정 — 목업 Settings. 탭바 없는 화면이라 (bare) 그룹, 웹도 가운데 한 단.
 *
 * 목업과 다른 점:
 * - 기준 위치: 목업의 "현재 위치(GPS) / 직접 선택" 대신 지금 기준 한 줄. 누르면 기준 위치 고르기 창
 *   (GPS는 뺐음 — lib/location.js 설명). 위치 이름은 서버가 쿠키에서 읽어 HTML에 바로 들어간다.
 *
 * TODO: 언어 · Language (시스템 / 한국어 / English) — 영어 문구 작업 때 화면 모드 위에 같은 세그먼트로 추가.
 *       "책 제목과 도서관 이름은 한국어로 표시돼요." 안내 문구도 같이.
 * TODO: 피드백 보내기 / 앱 정보 — 갈 곳(메일 주소, 앱 정보 화면)이 정해지면 기준 위치 아래 구분선 + 링크 행으로.
 */

export const metadata = {
    title: '설정 - 책어디',
    robots: { index: false },
};

export default async function SettingsPage() {
    const base = await getBase();

    return (
        <main className={styles.main}>
            <header className={styles.head}>
                <BackLink fallback="/" className={styles.back} />
                <h1 className={styles.title}>설정</h1>
            </header>

            <section aria-labelledby="theme-heading">
                <h2 id="theme-heading" className={styles.sectionTitle}>
                    화면 모드
                </h2>
                <ThemeSetting labelledBy="theme-heading" />
            </section>

            <section aria-labelledby="location-heading">
                <h2 id="location-heading" className={styles.sectionTitle}>
                    기준 위치
                </h2>
                {/* 누르면 기준 위치 고르기 창. 저장한 위치 관리도 그 창에서 */}
                <OpenLocationButton className={styles.row}>
                    <PinIcon size={20} className={styles.rowIcon} />
                    <span className={styles.rowText}>
                        <span className={styles.rowTitle}>
                            {base.label}
                            {base.isDefault && <span className={styles.rowSub}> (기본)</span>}
                        </span>
                        <span className={styles.rowMeta}>내 주변 도서관과 거리를 이 위치에서 재요</span>
                    </span>
                    <span className="sr-only">기준 위치 바꾸기</span>
                    <NextIcon size={18} className={styles.chevron} />
                </OpenLocationButton>
            </section>
        </main>
    );
}
