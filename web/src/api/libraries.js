import { apiGet } from "./client";

// 도서관 검색 — GET /api/libraries
// radius 단위 m(기본 5000, 100~50000), page 기본 1, size 기본 20(최대 50)
/** @returns {Promise<import("./types").LibrarySearchResponse>} */
export function searchLibraries({
  keyword,
  regionCode,
  dtlRegionCode,
  latitude,
  longitude,
  radius,
  page,
  size,
} = {}) {
  return apiGet("/api/libraries", {
    keyword,
    regionCode,
    dtlRegionCode,
    latitude,
    longitude,
    radius,
    page,
    size,
  });
}

// 지도 핀용 도서관 — GET /api/libraries/pins
// 목록과 같은 조건(검색어·지역·기준 위치·반경)에서 페이지 없이 가까운 순 최대 500곳. 응답 모양은 목록과 같음
// (totalCount가 libraries 수보다 크면 500곳에서 잘린 것)
/** @returns {Promise<import("./types").LibrarySearchResponse>} */
export function searchLibraryPins({ keyword, regionCode, dtlRegionCode, latitude, longitude, radius } = {}) {
  return apiGet("/api/libraries/pins", {
    keyword,
    regionCode,
    dtlRegionCode,
    latitude,
    longitude,
    radius,
  });
}

// 도서관 상세 — GET /api/libraries/{libCode}
/** @returns {Promise<import("./types").Library>} */
export function getLibrary(libCode) {
  return apiGet(`/api/libraries/${encodeURIComponent(libCode)}`);
}
