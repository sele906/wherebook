import { BriefcaseIcon, HomeIcon, PinIcon, StarIcon } from '../icons';

// 기준 위치 칩과 고르기 창이 같이 쓰는 표시 규칙

// 저장한 위치 이름으로 아이콘을 고른다 (집 / 회사 / 그 밖)
export function LocationIcon({ kind, label = '', ...props }) {
    if (kind !== 'saved') return <PinIcon {...props} />;
    if (label.includes('집')) return <HomeIcon {...props} />;
    if (label.includes('회사')) return <BriefcaseIcon {...props} />;
    return <StarIcon {...props} />;
}
