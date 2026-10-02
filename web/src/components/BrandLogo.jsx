/*
 * 화면 안에서 쓰는 로고 (assets/logo/app-icon-28.svg 와 같은 도형).
 * 색은 CSS 변수로 칠해서 다크에서는 밝은 브랜드 바탕 + 먹색 도형으로 바뀐다.
 * 파비콘·앱 아이콘은 app/icon.svg, app/apple-icon.png 가 따로 맡는다 (색 고정).
 *
 * 글자("책어디")는 이 SVG에 넣지 않는다 — 쓰는 쪽에서 텍스트로 붙인다.
 */
export default function BrandLogo({ size = 28 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" focusable="false">
            <rect width="28" height="28" rx="7" fill="var(--brand)" />
            {/* 위치 핀 */}
            <path
                d="M14 4.8a3.2 3.2 0 0 0-3.2 3.2c0 2.3 3.2 5.2 3.2 5.2s3.2-2.9 3.2-5.2A3.2 3.2 0 0 0 14 4.8z"
                fill="var(--bg)"
            />
            <circle cx="14" cy="8" r="1.1" fill="var(--brand)" />
            {/* 꽂힌 책 3권 + 선반. 가운데 책에 띠와 라벨 */}
            <rect x="8.6" y="16.4" width="3" height="4.8" rx="0.7" fill="var(--bg)" fillOpacity="0.75" />
            <rect x="12.3" y="14.8" width="3.4" height="6.4" rx="0.7" fill="var(--bg)" />
            <rect x="12.3" y="15.9" width="3.4" height="0.6" fill="var(--brand)" />
            <rect x="12.9" y="17.7" width="2.2" height="1.4" rx="0.45" fill="var(--brand)" />
            <rect
                x="16.4"
                y="16.4"
                width="2.8"
                height="4.8"
                rx="0.7"
                fill="var(--bg)"
                fillOpacity="0.75"
                transform="rotate(8 17.8 18.8)"
            />
            <rect x="7.8" y="21.4" width="12.4" height="1.5" rx="0.75" fill="var(--bg)" />
        </svg>
    );
}
