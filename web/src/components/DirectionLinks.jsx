import { MapIcon } from './icons';
import styles from './DirectionLinks.module.css';

/*
 * 길찾기 지도 앱 버튼 3개 (네이버 / 카카오 / 구글). 누르면 바로 그 지도로 간다.
 * 각 항목은 웹 주소라 휴대폰에 그 지도 앱이 있으면 앱으로, 없으면 브라우저 지도로 열린다.
 * (안드로이드의 "앱 선택" 창은 geo: 주소로만 뜨고 아이폰·PC에선 안 떠서 직접 고르게 함)
 *
 * - 카카오맵: 공식 "길찾기 도착지" 링크 (이름·좌표)
 * - 구글 지도: 공식 Maps URLs 장소 검색 (이름 + 주소) → 장소 카드의 "경로"로 길찾기.
 *   길찾기 주소(/maps/dir)는 도착지가 좌표 코드로 보이고 출발지(내 위치)를 못 잡으면 열리지 않은 듯 보여서 안 씀
 * - 네이버 지도: 공개된 길찾기 웹 주소 형식이 없어 이름으로 검색한 화면을 연다 (거기서 길찾기)
 *
 * 버튼 줄이 좁으면(컨테이너 폭 기준) 짧은 이름("네이버")으로 바뀐다. 고정 폭 없음.
 * 버튼 묶음 이름: 보이는 제목이 있으면 labelledBy(제목 id), 없으면 label(스크린리더용 글자).
 *
 * TODO: 앱으로 감싸게 되면 이 컴포넌트만 운영체제 기능으로 교체.
 *       안드로이드 = geo:위도,경도?q=이름 으로 열어 운영체제 "앱 선택" 창 사용,
 *       아이폰 = 설치된 지도 앱만 골라 보여주는 네이티브 메뉴(액션 시트).
 *       쓰는 쪽은 <DirectionLinks library /> 만 알고 있으므로 다른 화면은 안 바뀜.
 */
function directionLinks({ name, address, latitude, longitude }) {
    const hasPoint = latitude != null && longitude != null;
    return [
        {
            label: '네이버 지도',
            short: '네이버',
            href: `https://map.naver.com/p/search/${encodeURIComponent(name)}`,
        },
        hasPoint && {
            label: '카카오맵',
            short: '카카오',
            href: `https://map.kakao.com/link/to/${encodeURIComponent(name)},${latitude},${longitude}`,
        },
        {
            label: '구글 지도',
            short: '구글',
            href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, address].filter(Boolean).join(' '))}`,
        },
    ].filter(Boolean);
}

export default function DirectionLinks({ library, labelledBy, label }) {
    const links = directionLinks(library);

    return (
        <div className={styles.container}>
            <ul className={styles.list} aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : label}>
                {links.map((link) => (
                    <li key={link.label} className={styles.item}>
                        <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.option}
                            aria-label={`${link.label}로 길찾기 (새 창)`}
                        >
                            <MapIcon size={18} />
                            <span className={styles.full}>{link.label}</span>
                            <span className={styles.short}>{link.short}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
