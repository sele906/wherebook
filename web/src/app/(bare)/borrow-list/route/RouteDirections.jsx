'use client';

import { NavigationIcon } from '@/components/icons';

import { usePlanSelection } from './PlanSelection';
import styles from './page.module.css';

/*
 * 화면의 주요 행동(Primary) "지도 앱으로 길찾기". 기준 위치 → 고른 안의 도서관들(방문 순서) 도보 길찾기를 카카오맵으로 연다.
 * origin: { latitude, longitude } — 기준 위치
 * stops: { all, single } 각각 [{ latitude, longitude }, ...] (방문 순서) 또는 null
 *
 * 카카오맵 길찾기 연결 주소 applink.map.kakao.com/route (sp 출발 · vp, vp2 경유 · ep 도착, 좌표는 "위도,경도", by=foot 도보).
 * - 휴대폰: 카카오맵 앱(kakaomap://route)을 열고, 앱이 없으면 "앱 설치 / 설치없이 지도보기"를 고르게 한다
 * - PC: 카카오맵 웹 도보 길찾기로 바로 간다 (경유지까지 다 들어감)
 * 흔히 알려진 m.map.kakao.com/scheme/route 는 기기 정보(User-Agent)를 검사하는 단계가 있어서
 * 일부 브라우저에서 403 "Restricted User Agent"가 난다 — 그 단계가 넘겨주는 다음 주소로 바로 간다.
 * 공식 문서에 없는 주소라 카카오가 바꾸면 깨질 수 있음 (2026-10 확인).
 * 도보인 이유: 대중교통(by=publictransit)은 카카오가 "대중교통 길찾기에서는 경유지가 포함되지 않습니다"라며
 * 경유지를 빼고 출발 → 도착만 찾아서, 첫 도서관을 건너뛴다 (2026-10 확인).
 *
 * TODO: 실제 휴대폰(아이폰·안드로이드, 카카오톡 안 브라우저 포함)에서 앱이 열리는지 확인
 * TODO: 경유지 이름 표시 — 지금은 좌표만 넘겨서 앱에 주소로 보일 수 있음
 */

// 동선은 최대 3곳 → 경유지는 vp, vp2 까지만 쓴다
const VIA_KEYS = ['vp', 'vp2'];

const point = ({ latitude, longitude }) => `${latitude},${longitude}`;

function kakaoRouteHref(origin, stops) {
    const via = stops.slice(0, -1).slice(0, VIA_KEYS.length);
    const params = new URLSearchParams({ sp: point(origin) });
    via.forEach((stop, i) => params.set(VIA_KEYS[i], point(stop)));
    params.set('ep', point(stops.at(-1)));
    params.set('by', 'foot');
    return `https://applink.map.kakao.com/route?${params}`;
}

export default function RouteDirections({ origin, stops }) {
    const { plan } = usePlanSelection();
    const target = stops[plan] ?? stops.all ?? stops.single;
    if (!target?.length) return null;

    return (
        <div className={styles.directions}>
            <a href={kakaoRouteHref(origin, target)} target="_blank" rel="noopener noreferrer" className={styles.primary}>
                <NavigationIcon size={20} strokeWidth={2.2} />
                지도 앱으로 길찾기
                <span className="sr-only">(카카오맵, 새 창)</span>
            </a>
        </div>
    );
}
