'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Circle, CustomOverlayMap, Map, MarkerClusterer, useKakaoLoader } from 'react-kakao-maps-sdk';

import { LibraryIcon } from '@/components/icons';

import LibraryMapSkeleton from './LibraryMapSkeleton';
import styles from './LibraryMap.module.css';

/*
 * 도서관 지도 (카카오맵). 브라우저 전용이라 직접 쓰지 말고 LibraryMapLoader(dynamic, ssr: false)로 불러온다.
 * 목록과 같은 API 응답(libraries)을 그대로 받는다 — 지도 때문에 다시 호출하지 않음.
 * 지도가 실패해도 목록만으로 모든 기능을 쓸 수 있어서, 실패하면 지도 자리에 안내만 보여준다.
 *
 * 핀: 도서관 아이콘 원형 핀 (카카오 지도가 이미 글자로 복잡해서 이름은 평소에 안 보여줌).
 * 누르면 그 핀이 커지고 아래에 이름이 뜬다 → 이름을 누르면 도서관 상세. 지도 빈 곳을 누르면 선택 해제.
 * 핀은 버튼(이름은 aria-label)이지만 Tab 순서에서는 뺀다 — 키보드는 옆 목록이 맡는다 (목록 행 포커스 = 핀 선택).
 * 고른 도서관: selected·onSelect를 주면 밖(내 주변 목록)과 같이 쓰고, 안 주면 지도 안에서만 (동선 화면).
 * 고른 핀이 화면 밖이면 그쪽으로 지도를 옮긴다.
 *
 * 기준 위치: 작은 고리 점 (도서관 핀 아래층). 이름은 화면 제목에 글자로 있어서 지도에선 장식(aria-hidden).
 * 반경 원: 고른 반경(radiusKm). 카카오 원은 색을 JS 값(#xxxxxx)으로 받아서 --brand를 읽어 넘기고, 테마가 바뀌면 다시 읽는다.
 * 원이 다 보이게 확대 단계를 맞춘다 (화면 크기마다 다름). 지도를 덮는 요소(모바일 위 카드·바텀시트)만큼은 빼고 —
 * 그 높이는 쓰는 화면이 --map-inset-top / --map-inset-bottom으로 알려주고, 여기선 .fitArea로 px를 잰다.
 * 반경 안 도서관이 받은 핀보다 많으면(totalCount — 핀 API가 500곳에서 자르거나, 핀 API가 실패해 목록 한 페이지로 그릴 때)
 * 원 대신 지금 핀들에 맞추고 "가까운 N곳만 지도에 보여요"를 띄운다 — 큰 원 가운데 핀만 몰려 보이지 않게.
 *
 * 겹치는 핀은 묶음(클러스터)으로: 핀과 같은 브랜드 원에 아이콘 대신 개수. 누르면 그 자리로 확대 (카카오 기본).
 * 고른 핀은 묶지 않는다 — 목록에서 고른 핀이 묶음 안에 숨지 않게.
 *
 * TODO: 지도 위 버튼 — [확대·축소(웹)] [기준 위치로 이동]. 모바일은 바텀시트(--map-inset-bottom) 위로 올릴 것
 * TODO: 지도를 움직이면 "이 지역에서 다시 검색" — 기준 위치(지도 중심)를 바꾸는 흐름이 필요
 */

// 반경별 처음 확대 단계 (숫자가 작을수록 확대). 그린 뒤 바로 원에 맞춰 다시 정하므로 첫 화면용 짐작값
const LEVEL_BY_RADIUS_KM = { 1: 5, 3: 7, 5: 8, 10: 9 };

// 반경 원을 감싸는 사각형 (위도 1도 ≈ 111.32km, 경도 1도는 위도에 따라 줄어듦)
function circleBounds(lat, lng, meters) {
    const { LatLng, LatLngBounds } = window.kakao.maps;
    const dLat = meters / 111320;
    const dLng = meters / (111320 * Math.cos((lat * Math.PI) / 180));
    return new LatLngBounds(new LatLng(lat - dLat, lng - dLng), new LatLng(lat + dLat, lng + dLng));
}

// 지금 테마의 --brand 값. 테마는 <html data-theme> 또는 시스템 설정으로 바뀐다
function subscribeTheme(onChange) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', onChange);
    return () => {
        observer.disconnect();
        media.removeEventListener('change', onChange);
    };
}

function useBrandColor() {
    return useSyncExternalStore(
        subscribeTheme,
        () => getComputedStyle(document.documentElement).getPropertyValue('--brand').trim(),
        () => ''
    );
}

const countFormat = new Intl.NumberFormat('ko-KR');

// 묶음 모양. 카카오가 이 객체를 묶음 요소의 style에 그대로 붙여서 CSS 변수를 쓸 수 있다 (테마가 바뀌면 같이 바뀜).
// 도서관 핀(.pinMark)과 같은 원·테두리·그림자, 10곳 이상이면 조금 크게 (calculator [10])
const CLUSTER_STYLE = {
    borderRadius: 'var(--radius-full)',
    background: 'var(--brand)',
    boxShadow: '0 0 0 2px var(--bg), var(--shadow-float)',
    color: 'var(--on-brand)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    textAlign: 'center',
};
const CLUSTER_STYLES = [
    { ...CLUSTER_STYLE, width: 'var(--pin-size-selected)', height: 'var(--pin-size-selected)', lineHeight: 'var(--pin-size-selected)' },
    { ...CLUSTER_STYLE, width: 'var(--touch)', height: 'var(--touch)', lineHeight: 'var(--touch)' },
];
const clusterText = (size) => countFormat.format(size);

export default function LibraryMap({
    base,
    libraries,
    radiusKm,
    totalCount,
    active = true,
    selected: selectedProp,
    onSelect,
}) {
    const [loading, error] = useKakaoLoader({
        appkey: process.env.NEXT_PUBLIC_KAKAO_JS_KEY,
        libraries: ['clusterer'],
    });
    const [map, setMap] = useState(null);
    // 고른 도서관 libCode. 밖에서 주면 그 값, 아니면 지도 안에서만
    const [ownSelected, setOwnSelected] = useState(null);
    const selected = selectedProp !== undefined ? selectedProp : ownSelected;
    const setSelected = onSelect ?? setOwnSelected;
    const brand = useBrandColor();

    // 좌표가 없는 도서관은 핀을 그릴 수 없어서 뺀다 (목록에는 그대로 있음)
    const located = libraries.filter((lib) => lib.latitude != null && lib.longitude != null);
    // 반경 안 도서관이 목록 한 페이지보다 많으면(totalCount > 받은 수) 지도에 일부만 있다 → 원 대신 지금 핀들에 맞춘다
    const partial = totalCount != null && totalCount > libraries.length && located.length > 0;
    // 맞출 핀 좌표. effect가 핀 목록이 바뀔 때만 다시 돌도록 문자열로
    const pinPoints = partial ? located.map((lib) => `${lib.latitude},${lib.longitude}`).join(';') : '';

    const selectedLib = libraries.find((lib) => lib.libCode === selected && lib.latitude != null);
    const selectedLat = selectedLib?.latitude;
    const selectedLng = selectedLib?.longitude;

    // 고른 핀이 지금 보이는 범위 밖이면 그쪽으로 (목록에서 고른 경우)
    useEffect(() => {
        if (!map || !active || selectedLat == null) return;
        const point = new window.kakao.maps.LatLng(selectedLat, selectedLng);
        if (!map.getBounds().contain(point)) map.panTo(point);
    }, [map, active, selectedLat, selectedLng]);

    // 원(일부만 있으면 핀들)이 다 보이게: 지도를 덮는 요소를 뺀 영역(.fitArea)을 재서 그 안에 맞춘다.
    // 반경·기준 위치·핀이 바뀔 때, 숨겨져 있던 지도(모바일 목록 보기)가 다시 보일 때, 영역 크기가 바뀔 때
    // (화면 회전, 동선 시트 높이를 나중에 잰 경우). 다시 보일 때 relayout을 안 하면 카카오맵이 크기 0으로 알고 빈 화면으로 남는다
    const fitAreaRef = useRef(null);
    useEffect(() => {
        const fitArea = fitAreaRef.current;
        if (!map || !active || !fitArea) return;
        const fit = () => {
            map.relayout();
            const frame = fitArea.parentElement.getBoundingClientRect();
            const area = fitArea.getBoundingClientRect();
            if (area.width <= 0 || area.height <= 0) return;
            const { LatLng, LatLngBounds } = window.kakao.maps;
            let bounds;
            if (pinPoints) {
                // 기준 위치 + 지금 핀들
                bounds = new LatLngBounds();
                bounds.extend(new LatLng(base.latitude, base.longitude));
                for (const point of pinPoints.split(';')) {
                    const [lat, lng] = point.split(',').map(Number);
                    bounds.extend(new LatLng(lat, lng));
                }
            } else {
                bounds = circleBounds(base.latitude, base.longitude, radiusKm * 1000);
            }
            map.setBounds(
                bounds,
                area.top - frame.top,
                frame.right - area.right,
                frame.bottom - area.bottom,
                area.left - frame.left
            );
            // 핀은 잘리면 안 돼서 아래처럼 한 단계 더 확대하지 않는다
            if (pinPoints) return;
            // 확대 단계는 정수(한 단계마다 2배)라, 원이 한 단계에 조금만 안 들어가도 절반 크기가 된다.
            // 그래서 한 단계 더 확대해 보고, 원이 여백(--space-4)은 넘더라도 덮는 요소·화면 끝 밑으로
            // 여백 절반(8px)까지만 들어가면 그 단계를 쓴다 (작은 휴대폰에서 원 가장자리가 카드·시트 밑으로 살짝 숨는 정도)
            const edge = area.left - frame.left;
            const tolerance = edge / 2;
            const loose = {
                left: -tolerance,
                right: frame.width + tolerance,
                top: area.top - frame.top - edge - tolerance,
                bottom: area.bottom - frame.top + edge + tolerance,
            };
            const center = new LatLng(base.latitude, base.longitude);
            const level = map.getLevel();
            map.setLevel(level - 1, { anchor: center });
            const projection = map.getProjection();
            const sw = projection.containerPointFromCoords(bounds.getSouthWest());
            const ne = projection.containerPointFromCoords(bounds.getNorthEast());
            const fits = sw.x >= loose.left && ne.x <= loose.right && ne.y >= loose.top && sw.y <= loose.bottom;
            if (!fits) map.setLevel(level, { anchor: center });
        };
        // 처음 관찰할 때도 한 번 불린다
        const observer = new ResizeObserver(fit);
        observer.observe(fitArea);
        return () => observer.disconnect();
    }, [map, active, base.latitude, base.longitude, radiusKm, pinPoints]);

    if (loading) return <LibraryMapSkeleton />;
    if (error) {
        return (
            <div className={`${styles.frame} ${styles.fallback}`}>
                <p className={styles.fallbackText}>지도를 불러오지 못했어요. 목록에서 도서관을 볼 수 있어요.</p>
            </div>
        );
    }

    const center = { lat: base.latitude, lng: base.longitude };

    return (
        <div className={styles.frame}>
            <div ref={fitAreaRef} className={styles.fitArea} aria-hidden="true" />
            <Map
                center={center}
                level={LEVEL_BY_RADIUS_KM[radiusKm] ?? 7}
                className={styles.map}
                onCreate={setMap}
                onClick={() => setSelected(null)}
            >
                {brand && (
                    <Circle
                        center={center}
                        radius={radiusKm * 1000}
                        strokeWeight={2}
                        strokeColor={brand}
                        strokeOpacity={0.7}
                        fillColor={brand}
                        fillOpacity={0.06}
                    />
                )}
                <CustomOverlayMap position={center} zIndex={0}>
                    <span className={styles.baseDot} aria-hidden="true" />
                </CustomOverlayMap>
                {/* gridSize: 핀(32px)이 실제로 겹칠 만큼 가까울 때만 묶이게 기본값(60)보다 좁게 */}
                <MarkerClusterer
                    averageCenter
                    gridSize={48}
                    styles={CLUSTER_STYLES}
                    calculator={[10]}
                    texts={clusterText}
                >
                    {located
                        .filter((lib) => lib.libCode !== selected)
                        .map((lib) => (
                            <LibraryPinOverlay key={lib.libCode} library={lib} onSelect={setSelected} />
                        ))}
                </MarkerClusterer>
                {/* 고른 핀은 묶음 밖에, 다른 핀 위로 */}
                {selectedLib && <LibraryPinOverlay library={selectedLib} selected onSelect={setSelected} />}
            </Map>
            {partial && (
                <p className={styles.partialNote}>{`가까운 ${countFormat.format(located.length)}곳만 지도에 보여요`}</p>
            )}
        </div>
    );
}

// 지도 위에 올린 핀. clickable: 핀을 눌러도 지도 클릭(선택 해제)으로 번지지 않게
function LibraryPinOverlay({ library, selected = false, onSelect }) {
    return (
        <CustomOverlayMap
            position={{ lat: library.latitude, lng: library.longitude }}
            clickable
            zIndex={selected ? 2 : 1}
        >
            <LibraryPin library={library} selected={selected} onSelect={() => onSelect(library.libCode)} />
        </CustomOverlayMap>
    );
}

// 핀 한 개. 상자는 누르는 영역(44px) 크기로 고정하고, 이름은 그 아래에 띄워서 핀 위치(좌표 = 상자 가운데)가 안 밀린다
function LibraryPin({ library, selected, onSelect }) {
    return (
        <div className={styles.pin} data-selected={selected || undefined}>
            <button
                type="button"
                className={styles.pinButton}
                tabIndex={-1}
                aria-label={library.name}
                aria-pressed={selected}
                onClick={onSelect}
            >
                <span className={styles.pinMark}>
                    <LibraryIcon size={selected ? 22 : 18} strokeWidth={2.2} />
                </span>
            </button>
            {selected && (
                <Link href={`/libraries/${library.libCode}`} className={styles.pinName}>
                    <span className={styles.pinNameText}>{library.name}</span>
                </Link>
            )}
        </div>
    );
}
