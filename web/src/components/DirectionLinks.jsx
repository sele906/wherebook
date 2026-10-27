'use client';

import { useLocationState } from './location/LocationProvider';
import { MapIcon } from './icons';
import styles from './DirectionLinks.module.css';

/*
 * 길찾기 지도 앱 버튼 3개 (네이버 / 카카오 / 구글). 누르면 바로 그 지도로 간다.
 * 각 항목은 웹 주소라 휴대폰에 그 지도 앱이 있으면 앱으로, 없으면 브라우저 지도로 열린다.
 * (안드로이드의 "앱 선택" 창은 geo: 주소로만 뜨고 아이폰·PC에선 안 떠서 직접 고르게 함)
 *
 * 출발지 = 기준 위치 (GPS는 쓰지 않음). 기준 위치는 브라우저에만 있어서(localStorage) 클라이언트 컴포넌트다 —
 * 서버 HTML에는 도착지만 있는 링크가 들어가고, 화면이 뜨면 출발지를 더한다.
 * 기본값(서울 시청)은 실제로 있는 곳이 아니라 넣지 않는다 → 앱이 휴대폰 현재 위치에서 출발.
 *
 * - 카카오맵: 출발지가 있으면 길찾기 연결 주소 applink.map.kakao.com/route (출발·도착 좌표 + 이름 sn·en, 대중교통),
 *   없으면 공식 "길찾기 도착지" 링크. applink를 쓰는 이유는 동선 화면 RouteDirections 설명 참고
 * - 네이버 지도: 출발지가 있으면 길찾기 웹 주소 map.naver.com/p/directions/경도,위도,이름,,/경도,위도,이름,,/-/transit
 *   (좌표는 경도 먼저). 공식 문서에 없는 주소라 네이버가 바꾸면 깨질 수 있음 (2026-10 확인: PC는 웹 길찾기,
 *   안드로이드는 앱 연결, 아이폰은 앱 → 없으면 네이버 검색 "빠른길찾기"). 공식은 앱 전용 nmap://route/public 뿐이라
 *   앱이 없으면 열리지 않아서 안 씀. 출발지가 없으면 이름으로 검색한 화면 (거기서 길찾기)
 * - 구글 지도: 장소 검색 (이름 + 주소) → 장소 카드의 "경로"로 길찾기.
 *   TODO: 출발지가 있으면 공식 Maps URLs 길찾기 /maps/dir/?api=1&origin=위도,경도&destination=이름 주소&travelmode=transit
 *         — PC 크롬에선 열렸지만 사용자 기기에서 구글 지도가 열리지 않아(2026-10-28) 보류. 실제 기기에서 확인 후 넣기
 *
 * 버튼 줄이 좁으면(컨테이너 폭 기준) 짧은 이름("네이버")으로 바뀐다. 고정 폭 없음.
 * 버튼 묶음 이름: 보이는 제목이 있으면 labelledBy(제목 id), 없으면 label(스크린리더용 글자).
 *
 * TODO: 앱으로 감싸게 되면 이 컴포넌트만 운영체제 기능으로 교체.
 *       안드로이드 = geo:위도,경도?q=이름 으로 열어 운영체제 "앱 선택" 창 사용,
 *       아이폰 = 설치된 지도 앱만 골라 보여주는 네이티브 메뉴(액션 시트).
 *       쓰는 쪽은 <DirectionLinks library /> 만 알고 있으므로 다른 화면은 안 바뀜.
 */
const point = (lat, lng) => `${lat},${lng}`;

function kakaoHref({ name, latitude, longitude }, origin) {
    if (!origin) return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${latitude},${longitude}`;
    const params = new URLSearchParams({
        sp: point(origin.latitude, origin.longitude),
        sn: origin.label,
        ep: point(latitude, longitude),
        en: name,
        by: 'publictransit',
    });
    return `https://applink.map.kakao.com/route?${params}`;
}

// 네이버 길찾기 주소의 한 지점: "경도,위도,이름,," (이름 속 쉼표는 encodeURIComponent가 %2C로)
const naverPoint = (lat, lng, name) => `${lng},${lat},${encodeURIComponent(name)},,`;

function naverHref({ name, latitude, longitude }, origin) {
    if (!origin || latitude == null || longitude == null) {
        return `https://map.naver.com/p/search/${encodeURIComponent(name)}`;
    }
    const start = naverPoint(origin.latitude, origin.longitude, origin.label);
    const goal = naverPoint(latitude, longitude, name);
    return `https://map.naver.com/p/directions/${start}/${goal}/-/transit`;
}

// origin: { label, latitude, longitude } 또는 null (도착지만)
function directionLinks(library, origin) {
    const hasPoint = library.latitude != null && library.longitude != null;
    return [
        {
            label: '네이버 지도',
            short: '네이버',
            href: naverHref(library, origin),
        },
        hasPoint && {
            label: '카카오맵',
            short: '카카오',
            href: kakaoHref(library, origin),
        },
        {
            label: '구글 지도',
            short: '구글',
            href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([library.name, library.address].filter(Boolean).join(' '))}`,
        },
    ].filter(Boolean);
}

export default function DirectionLinks({ library, labelledBy, label }) {
    // 서버 렌더링·하이드레이션 중에는 null → 도착지만. 기본값(서울 시청)도 출발지로 안 넣음
    const state = useLocationState();
    const origin = state && state.base.kind !== 'default' ? state.base : null;
    const links = directionLinks(library, origin);

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
