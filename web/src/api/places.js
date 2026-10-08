import { apiGet } from "./client";

/*
 * 기준 위치 고르기용 주소 검색 (행정안전부 도로명주소 API를 백엔드가 대신 부름).
 * 1) searchPlaces: 검색어 → 주소 목록 (좌표 없음)
 * 2) getCoordinates: 고른 주소 하나의 키 5개 → 좌표
 */

/**
 * 좌표 API에 그대로 넘기는 주소 키 (도로명주소 API 응답 그대로)
 * @typedef {{ admCd: string, rnMgtSn: string, udrtYn: string, buldMnnm: string, buldSlno: string }} AddressKey
 * @typedef {AddressKey & { name: string, address: string, emdNm: string }} AddressResult
 */

// 주소 검색 — GET /api/places?keyword=
/** @returns {Promise<AddressResult[]>} */
export async function searchPlaces(q) {
  const results = await apiGet("/api/places", { keyword: q });
  // 좌표를 받을 키가 빠진 항목은 고를 수 없으므로 뺀다
  return (results ?? [])
    .filter((item) => item.address && isAddressKey(item))
    .map((item) => ({ ...item, address: shortenSido(item.address), emdNm: item.emdNm ?? "" }));
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

export function isAddressKey(key) {
  return (
    /^\d{10}$/.test(key?.admCd ?? "") &&
    /^\d{12}$/.test(key?.rnMgtSn ?? "") &&
    /^[01]$/.test(key?.udrtYn ?? "") &&
    /^\d{1,5}$/.test(key?.buldMnnm ?? "") &&
    /^\d{1,5}$/.test(key?.buldSlno ?? "")
  );
}

/*
 * 주소 키 → 좌표 { latitude, longitude }. 모르면 null
 *
 * TODO: 좌표제공 API 승인이 나면 백엔드 API로 교체하고 아래 임시 표를 지운다.
 *       예) GET /api/places/coordinates?admCd=&rnMgtSn=&udrtYn=&buldMnnm=&buldSlno= → { latitude, longitude }
 *       좌표제공 API는 GRS80 UTM-K(entX, entY)로 주므로 위도·경도(WGS84) 변환은 백엔드에서.
 * 지금은 행정구역코드(admCd) 앞 5자리(시군구) → 없으면 앞 2자리(시도)의 청사 근처 좌표를 돌려준다.
 * 같은 구 안의 주소는 모두 같은 좌표가 되므로 거리는 구 단위로만 맞다.
 */
const TEMP_SIGUNGU = {
  11140: [37.5641, 126.9979], // 서울 중구
  11440: [37.5663, 126.9019], // 서울 마포구
  11680: [37.5172, 127.0473], // 서울 강남구
  28237: [37.507, 126.7219], // 인천 부평구
  41192: [37.5034, 126.766], // 부천 원미구
  41194: [37.4826, 126.7955], // 부천 소사구
  41196: [37.5265, 126.7967], // 부천 오정구
};

const TEMP_SIDO = {
  11: [37.5665, 126.978], // 서울
  26: [35.1796, 129.0756], // 부산
  27: [35.8714, 128.6014], // 대구
  28: [37.4563, 126.7052], // 인천
  29: [35.1595, 126.8526], // 광주
  30: [36.3504, 127.3845], // 대전
  31: [35.5384, 129.3114], // 울산
  36: [36.48, 127.289], // 세종
  41: [37.275, 127.0095], // 경기
  42: [37.8813, 127.7298], // 강원 (옛 코드)
  51: [37.8813, 127.7298], // 강원
  43: [36.6357, 127.4917], // 충북
  44: [36.6588, 126.6728], // 충남
  45: [35.8242, 127.148], // 전북 (옛 코드)
  52: [35.8242, 127.148], // 전북
  46: [34.8161, 126.4629], // 전남
  47: [36.576, 128.5056], // 경북
  48: [35.2383, 128.6925], // 경남
  50: [33.4996, 126.5312], // 제주
};

/** @param {AddressKey} key */
export async function getCoordinates(key) {
  const point = TEMP_SIGUNGU[key.admCd.slice(0, 5)] ?? TEMP_SIDO[key.admCd.slice(0, 2)];
  return point ? { latitude: point[0], longitude: point[1] } : null;
}
