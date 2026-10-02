import { apiGet } from "./client";

// 책을 소장한 도서관 — GET /api/books/{isbn13}/libraries
// radius 단위 m(기본 10000, 100~50000), libCodes는 쉼표로 구분한 도서관 코드
/** @returns {Promise<import("./types").LibrarySearchByBookResponse>} */
export function searchLibrariesByBook(
  isbn13,
  { region, latitude, longitude, radius, libCodes } = {}
) {
  return apiGet(`/api/books/${encodeURIComponent(isbn13)}/libraries`, {
    region,
    latitude,
    longitude,
    radius,
    libCodes: Array.isArray(libCodes) ? libCodes.join(",") : libCodes,
  });
}

// 도서관 한 곳의 청구기호 — GET /api/books/{isbn13}/libraries/{libCode}/call-number
/** @returns {Promise<import("./types").CallNumberResponse>} */
export function getCallNumber(isbn13, libCode) {
  return apiGet(
    `/api/books/${encodeURIComponent(isbn13)}/libraries/${encodeURIComponent(libCode)}/call-number`
  );
}

// 소장·대출 가능 여부 — GET /api/books/{isbn13}/libraries/{libCode}/loan-status
// 느린 외부 조회라 목록 화면에서 책마다 부르지 않는다. 항상 최신 값을 받도록 캐시하지 않는다.
/** @returns {Promise<import("./types").LoanStatusResponse>} */
export function getLoanStatus(isbn13, libCode) {
  return apiGet(
    `/api/books/${encodeURIComponent(isbn13)}/libraries/${encodeURIComponent(libCode)}/loan-status`,
    undefined,
    { cache: "no-store" }
  );
}
