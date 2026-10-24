'use client';

import { useEffect, useState } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';

import LibraryMapSkeleton from './LibraryMapSkeleton';
import styles from './LibraryMap.module.css';

/*
 * 도서관 지도 (카카오맵). 브라우저 전용이라 직접 쓰지 말고 LibraryMapLoader(dynamic, ssr: false)로 불러온다.
 * 목록과 같은 API 응답(libraries)을 그대로 받는다 — 지도 때문에 다시 호출하지 않음.
 * 지도가 실패해도 목록만으로 모든 기능을 쓸 수 있어서, 실패하면 지도 자리에 안내만 보여준다.
 *
 * 그리는 것: 도서관 기본 마커만.
 * 지금은 웹·모바일 지도 레이아웃을 먼저 다듬는 단계라 지도 안 디자인은 기본 모양.
 *
 * TODO: 지도 디자인 — 도서관 이름 핀(누르면 상세), 기준 위치 점, 반경 원 (DESIGN.md 지도)
 * TODO: 지도 위 버튼 — [확대·축소(웹)] [기준 위치로 이동]. 모바일은 바텀시트(--sheet-h) 위로 올릴 것
 * TODO: 핀이 겹치면 클러스터로 묶기 (DESIGN.md: 핀 36px, 겹치면 클러스터)
 * TODO: 목록과 선택 상태 공유 (목록에서 고르면 핀이 커지고, 핀을 누르면 행 강조)
 * TODO: 지도를 움직이면 "이 지역에서 다시 검색" — 기준 위치(지도 중심)를 바꾸는 흐름이 필요
 * TODO: 다크 모드에서 지도 타일 밝기 확인, 테마를 바꾸면 원 색 다시 읽기
 */

// 반경별 처음 확대 단계 (숫자가 작을수록 확대). 원이 화면에 들어오도록
const LEVEL_BY_RADIUS_KM = { 1: 5, 3: 7, 5: 8, 10: 9 };

export default function LibraryMap({ base, libraries, radiusKm, active = true }) {
    const [loading, error] = useKakaoLoader({
        appkey: process.env.NEXT_PUBLIC_KAKAO_JS_KEY,
    });
    const [map, setMap] = useState(null);

    // 숨겨져 있던 지도(모바일 목록 보기)가 다시 보이면 크기를 다시 재고 기준 위치로 맞춘다.
    // 안 하면 카카오맵이 크기 0으로 알고 있어서 빈 화면으로 남는다
    useEffect(() => {
        if (!map || !active) return;
        map.relayout();
        map.setCenter(new window.kakao.maps.LatLng(base.latitude, base.longitude));
    }, [map, active, base.latitude, base.longitude]);

    if (loading) return <LibraryMapSkeleton />;
    if (error) {
        return (
            <div className={`${styles.frame} ${styles.fallback}`}>
                <p className={styles.fallbackText}>지도를 불러오지 못했어요. 목록에서 도서관을 볼 수 있어요.</p>
            </div>
        );
    }

    const center = { lat: base.latitude, lng: base.longitude };
    // 좌표가 없는 도서관은 핀을 그릴 수 없어서 뺀다 (목록에는 그대로 있음)
    const located = libraries.filter((lib) => lib.latitude != null && lib.longitude != null);

    return (
        <div className={styles.frame}>
            <Map center={center} level={LEVEL_BY_RADIUS_KM[radiusKm] ?? 7} className={styles.map} onCreate={setMap}>
                {/* TODO: 지도 디자인 단계에서 기본 마커 → 도서관 이름 핀, 기준 위치 점, 반경 원 */}
                {located.map((lib) => (
                    <MapMarker key={lib.libCode} position={{ lat: lib.latitude, lng: lib.longitude }} title={lib.name} />
                ))}
            </Map>
        </div>
    );
}
