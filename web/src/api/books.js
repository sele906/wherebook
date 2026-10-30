import { apiGet } from "./client";

// 도서 검색 — GET /api/books
// pageNo 기본 1, pageSize 기본 20(최대 50)
/** @returns {Promise<import("./types").BookSearchResponse>} */
export function searchBooks({ title, pageNo, pageSize } = {}) {
  return apiGet("/api/books", { title, pageNo, pageSize });
}

// 이번 주 인기 대출 — GET /api/books/popular (백엔드가 최근 7일로 정해서 정보나루를 부름)
// TODO: 캐시 — 백엔드에서 할지 프론트(fetch next.revalidate)에서 할지 정해지면 추가 (정보나루 일일 호출 한도)
// pageNo 기본 1, pageSize 기본 20(최대 50)
/** @returns {Promise<import("./types").BookSearchResponse>} */
export function getPopularBooks({ pageNo, pageSize } = {}) {
  return apiGet("/api/books/popular", { pageNo, pageSize });
}

// 도서 상세 — GET /api/books/{isbn13}
/** @returns {Promise<import("./types").Book>} */
export function getBook(isbn13) {
  return apiGet(`/api/books/${encodeURIComponent(isbn13)}`);
}
