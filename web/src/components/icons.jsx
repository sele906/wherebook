/*
 * 목업(assets/chaekeodi-ui-mockup.html)에서 쓰는 라인 아이콘들.
 * 색은 stroke="currentColor"로 두고 감싸는 요소의 color로 제어함.
 *
 * TODO: 나중에 react-icons로 교체 예정.
 *       쓰는 쪽은 <SearchIcon size strokeWidth /> 형태만 알고 있으니
 *       이 파일 안에서 react-icons 컴포넌트로 갈아끼우면 됨.
 */

function Icon({ size = 24, strokeWidth = 2, children }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

export function SearchIcon(props) {
    return (
        <Icon {...props}>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
        </Icon>
    );
}

export function BagIcon(props) {
    return (
        <Icon {...props}>
            <path d="M5 8h14l-1.2 12H6.2L5 8z" />
            <path d="M9 8a3 3 0 0 1 6 0" />
        </Icon>
    );
}

export function PinIcon(props) {
    return (
        <Icon {...props}>
            <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
            <circle cx="12" cy="10" r="2.5" />
        </Icon>
    );
}

export function GearIcon(props) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </Icon>
    );
}

export function LocateIcon(props) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </Icon>
    );
}

export function PlusIcon(props) {
    return (
        <Icon {...props}>
            <path d="M12 5v14M5 12h14" />
        </Icon>
    );
}

export function BackIcon(props) {
    return (
        <Icon {...props}>
            <path d="M15 5l-7 7 7 7" />
        </Icon>
    );
}
