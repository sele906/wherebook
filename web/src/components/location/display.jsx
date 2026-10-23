import { BriefcaseIcon, HomeIcon, PinIcon, StarIcon } from '../icons';

// 기준 위치 고르기 창 안에서만 쓰는 표시 규칙. 창 밖(제목 버튼 등)의 위치 아이콘은 항상 핀

// 저장한 위치 이름으로 아이콘을 고른다 (집 / 회사 / 그 밖)
export function LocationIcon({ kind, label = '', ...props }) {
    if (kind !== 'saved') return <PinIcon {...props} />;
    if (label.includes('집')) return <HomeIcon {...props} />;
    if (label.includes('회사')) return <BriefcaseIcon {...props} />;
    return <StarIcon {...props} />;
}
