import { apiGet } from "./client";

/*
 * 장소 검색 (역·건물·동 이름 → 좌표). 기준 위치를 고를 때 쓴다.
 * 백엔드가 카카오 로컬 키워드 검색을 대신 불러 준다 (카카오 키는 백엔드에만 있음).
 */

/** @typedef {{ name: string, address: string, category: string, latitude: number, longitude: number }} Place */

// 장소 검색 — GET /api/places?keyword=
/** @returns {Promise<Place[]>} */
export async function searchPlaces(q) {
  const places = await apiGet("/api/places", { keyword: q });
  // 좌표가 없는 항목은 기준 위치로 쓸 수 없으므로 뺀다
  return (places ?? []).filter(
    (place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude),
  );
}
