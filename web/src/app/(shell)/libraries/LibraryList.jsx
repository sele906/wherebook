'use client';

import { useEffect, useRef } from 'react';

import LibraryRow from '@/components/LibraryRow';
import { NextIcon } from '@/components/icons';

import { useIsWide, useNearbySelection } from './NearbyView';
import styles from './page.module.css';

/*
 * 내 주변 도서관 목록 (패널·바텀시트 둘 다). 지도와 고른 도서관을 같이 쓴다 (NearbyView).
 * - 행에 올리거나 포커스하면 → 지도에서 그 핀이 커지고 이름이 뜸. 행을 누르면 지금처럼 상세로
 * - 지도에서 핀을 누르면 → 그 행 강조 + 보이도록 스크롤 (이미 보이면 그대로)
 * 웹에서만. 모바일은 연결하지 않는다 (NearbyView 설명). 터치로 닿은 건 선택으로 치지 않는다 (스크롤·시트 펼치기 중 닿은 행)
 * 행 모양은 LibraryRow 그대로, 오른쪽은 화살표 (행 전체가 도서관 상세 링크). 서버에서도 렌더링돼서 HTML에 목록이 들어 있다.
 */
export default function LibraryList({ libraries, withAddress = false }) {
    const { selected: sharedSelected, setSelected } = useNearbySelection();
    const isWide = useIsWide();
    const selected = isWide ? sharedSelected : null;
    const listRef = useRef(null);

    function preview(libCode, e) {
        if (!isWide || e.pointerType === 'touch') return;
        setSelected(libCode);
    }

    useEffect(() => {
        if (!selected) return;
        // 숨겨진 목록(웹의 바텀시트, 모바일 지도 보기의 패널)에서는 아무 일도 안 일어남
        listRef.current?.querySelector(`[data-lib-code="${selected}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [selected]);

    return (
        <ul ref={listRef} className={styles.list}>
            {libraries.map((lib) => (
                <LibraryRow
                    key={lib.libCode}
                    library={lib}
                    detail={withAddress ? lib.address : undefined}
                    badge={
                        <span className={styles.chevron}>
                            <NextIcon size={20} />
                        </span>
                    }
                    selected={lib.libCode === selected}
                    onPreview={(e) => preview(lib.libCode, e)}
                />
            ))}
        </ul>
    );
}
