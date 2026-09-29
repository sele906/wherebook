/*
 * 헤더용 로고 (둥근 사각형 버전).
 * assets/logo.svg는 배경이 꽉 찬 1024x1024 앱 아이콘이라 용도가 다름 —
 * 파비콘/OG 이미지에 쓰고, 화면 안에서는 이 컴포넌트를 씀.
 *
 * TODO: 로고 디자인 자체가 바뀔 수 있음. 바뀌면 이 svg 내용만 갈아끼우면 되고,
 *       쓰는 쪽은 <BrandLogo size /> 인터페이스만 알고 있음.
 */
export default function BrandLogo({ size = 28 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
            <rect width="28" height="28" rx="7" fill="var(--brand)" />
            {/* 위치 핀 */}
            <path
                d="M14 4.8a3.2 3.2 0 0 0-3.2 3.2c0 2.3 3.2 5.2 3.2 5.2s3.2-2.9 3.2-5.2A3.2 3.2 0 0 0 14 4.8z"
                fill="var(--bg)"
            />
            <circle cx="14" cy="8" r="1.1" fill="var(--brand)" />
            {/* 꽂힌 책 3권 + 선반 */}
            <rect x="8.6" y="16.4" width="3" height="4.8" rx="0.7" fill="var(--logo-dim)" />
            <rect x="12.3" y="14.8" width="3.4" height="6.4" rx="0.7" fill="var(--bg)" />
            <rect
                x="16.4"
                y="16.4"
                width="2.8"
                height="4.8"
                rx="0.7"
                fill="var(--logo-dim)"
                transform="rotate(8 17.8 18.8)"
            />
            <rect x="7.8" y="21.4" width="12.4" height="1.5" rx="0.75" fill="var(--bg)" />
        </svg>
    );
}
