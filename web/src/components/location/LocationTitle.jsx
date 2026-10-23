import { ChevronDownIcon, PinIcon } from '../icons';
import OpenLocationButton from './OpenLocationButton';
import styles from './LocationTitle.module.css';

/*
 * 기준 위치를 제목처럼 보여주고, 누르면 기준 위치 고르기 창을 여는 버튼. [핀] 부개역 1호선 ▾
 * 아이콘은 항상 핀 — 집·회사처럼 이름별 아이콘은 고르기 창 안에서만 쓴다.
 *
 * base는 서버가 쿠키에서 읽은 값(getBase)이라 글자가 HTML에 바로 들어간다.
 * 위치를 바꾸면 LocationProvider가 쿠키를 맞추고 화면을 다시 불러와서 글자도 바뀐다.
 * 아직 기준을 고르지 않았으면(기본값) 이름 옆에 "(기본)".
 *
 * text: 버튼에 보일 글자 (기본은 위치 이름. 메인 카드는 "부개역 1호선 근처")
 * size: 'md' 카드 제목 | 'lg' 화면 제목
 */
export default function LocationTitle({ base, text = base.label, size = 'md', className }) {
    return (
        <OpenLocationButton
            data-size={size}
            className={className ? `${styles.button} ${className}` : styles.button}
        >
            <PinIcon size={size === 'lg' ? 22 : 18} strokeWidth={2.2} className={styles.pin} />
            <span className={styles.text}>{text}</span>
            {base.isDefault && <span className={styles.sub}>(기본)</span>}
            <span className="sr-only">기준 위치 바꾸기</span>
            <ChevronDownIcon size={size === 'lg' ? 20 : 16} className={styles.chevron} />
        </OpenLocationButton>
    );
}
