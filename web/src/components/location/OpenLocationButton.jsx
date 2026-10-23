'use client';

import { useOpenLocationPicker } from './LocationProvider';

// 기준 위치 고르기 창을 여는 버튼. 모양과 글자는 부르는 쪽이 정한다 (서버 컴포넌트에서 children으로 넘김)
export default function OpenLocationButton({ children, ...props }) {
    const open = useOpenLocationPicker();
    return (
        <button type="button" onClick={open} aria-haspopup="dialog" {...props}>
            {children}
        </button>
    );
}
