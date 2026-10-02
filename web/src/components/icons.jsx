/*
 * 앱에서 쓰는 라인 아이콘. react-icons의 Lucide(lu) 세트 — 목업의 둥근 선 아이콘과 같은 계열.
 * 쓰는 쪽은 <SearchIcon size strokeWidth /> 형태만 알고, 어떤 세트인지는 이 파일만 안다.
 * 색은 currentColor라 감싸는 요소의 color를 따른다.
 * 장식용이라 기본으로 aria-hidden. 아이콘만 있는 버튼은 버튼 쪽에 aria-label을 단다.
 */
import {
    LuSearch,
    LuShoppingBag,
    LuMapPin,
    LuSettings,
    LuLocateFixed,
    LuPlus,
    LuChevronLeft,
} from 'react-icons/lu';

function wrap(Icon) {
    return function AppIcon({ size = 24, strokeWidth = 2, ...rest }) {
        return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" focusable="false" {...rest} />;
    };
}

export const SearchIcon = wrap(LuSearch);
export const BagIcon = wrap(LuShoppingBag);
export const PinIcon = wrap(LuMapPin);
export const GearIcon = wrap(LuSettings);
export const LocateIcon = wrap(LuLocateFixed);
export const PlusIcon = wrap(LuPlus);
export const BackIcon = wrap(LuChevronLeft);
