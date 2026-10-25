'use client';

import { NavigationIcon } from '@/components/icons';

import { usePlanSelection } from './PlanSelection';
import styles from './page.module.css';

/*
 * 화면의 주요 행동(Primary) "지도 앱으로 길찾기". 고른 안의 첫 도서관을 도착지로 카카오맵 길찾기를 연다
 * (카카오맵 공식 "길찾기 도착지" 링크 — DirectionLinks와 같은 형식).
 * destinations: { all, single } 각각 { name, latitude, longitude } 또는 null
 * TODO: 경유지까지 한 번에 — 카카오맵 웹 링크가 경유지 여러 곳을 받는지 공식 문서 확인 후 (지금은 첫 도서관만)
 */
export default function RouteDirections({ destinations }) {
    const { plan } = usePlanSelection();
    const target = destinations[plan] ?? destinations.all ?? destinations.single;
    if (!target) return null;

    const href = `https://map.kakao.com/link/to/${encodeURIComponent(target.name)},${target.latitude},${target.longitude}`;

    return (
        <div className={styles.directions}>
            <a href={href} target="_blank" rel="noopener noreferrer" className={styles.primary}>
                <NavigationIcon size={20} strokeWidth={2.2} />
                지도 앱으로 길찾기
                <span className="sr-only">(카카오맵, 새 창)</span>
            </a>
        </div>
    );
}
