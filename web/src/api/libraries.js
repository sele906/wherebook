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

// 도서관 상세 — GET /api/libraries/{libCode}
/** @returns {Promise<import("./types").Library>} */
export function getLibrary(libCode) {
  return apiGet(`/api/libraries/${encodeURIComponent(libCode)}`);
}
