import { ApiError, apiGet } from "./client";

/*
 * 기준 위치 고르기용 장소 검색.
 * 1) searchPlaces: 검색어 → 장소 목록 (카카오 장소 검색, 좌표 없음)
 * 2) getPlaceCoord: 고른 장소의 주소 → 도로명주소 API의 이름·주소·좌표
 *
 * 저장하는 값(이름·주소·좌표)은 getPlaceCoord 응답에서 가져온다.
 */

/**
 * @typedef {{ name: string, address: string, category: string }} PlaceResult
 * @typedef {{ name: string, address: string, latitude: number, longitude: number }} PlaceCoord
 */

// 장소 검색 — GET /api/places?keyword=
/** @returns {Promise<PlaceResult[]>} */
export async function searchPlaces(q) {
  const results = await apiGet("/api/places", { keyword: q });
  // 주소가 없으면 좌표를 받을 수 없으므로 뺀다
  return (results ?? [])
    .filter((item) => item.name && item.address)
    .map((item) => ({ name: item.name, address: item.address, category: item.category ?? "" }));
}

/*
 * 고른 장소의 이름·카카오 주소 → 백엔드가 도로명주소 API로 다시 찾은 { name, address, latitude, longitude }.
 * name은 보낸 장소 이름 그대로, address는 도로명주소 API의 주소.
 * 주소가 정확히 맞는 도로명주소가 없으면(지번만 있는 장소 등) 백엔드가 404 → null
 * GET /api/places/coord?name=&address=
 */
/** @returns {Promise<PlaceCoord | null>} */
export async function getPlaceCoord(name, address) {
  try {
    const coord = await apiGet("/api/places/coord", { name, address });
    return {
      name: coord.name || name,
      address: shortenSido(coord.address ?? address),
      latitude: coord.latitude,
      longitude: coord.longitude,
    };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

// "인천광역시 부평구 …" → "인천 부평구 …" (한눈에 읽히게. 저장되는 주소도 이 모양)
const SIDO_SHORT = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  강원도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  전라북도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

function shortenSido(address) {
  const [first, ...rest] = address.trim().split(/\s+/);
  const short = SIDO_SHORT[first];
  return short ? [short, ...rest].join(" ") : address.trim();
}
