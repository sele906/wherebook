import { ApiError, apiGet } from "./client";

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

// 대출 가능 여부를 한 번에 조회하는 도서관 수. 화면에서도 이 단위로 나눠 보여준다.
export const LOAN_BATCH_SIZE = 6;

const LOAN_STATUS_ERROR = { bookExists: false, loanAvailable: false, status: 'ERROR' };

// 여러 도서관의 대출 여부를 동시에 조회. 한 곳이 실패해도 나머지는 살리고 그곳만 ERROR.
/** @returns {Promise<Record<string, import("./types").LoanStatusResponse>>} */
export async function getLoanStatuses(isbn13, libCodes) {
  const results = await Promise.all(
    libCodes.map((libCode) =>
      getLoanStatus(isbn13, libCode).catch((e) => {
        if (e instanceof ApiError) return LOAN_STATUS_ERROR;
        throw e;
      })
    )
  );
  return Object.fromEntries(libCodes.map((libCode, i) => [libCode, results[i]]));
}
