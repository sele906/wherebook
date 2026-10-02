import { apiGet } from "./client";

// 도서 검색 — GET /api/books
// pageNo 기본 1, pageSize 기본 20(최대 50)
/** @returns {Promise<import("./types").BookSearchResponse>} */
export function searchBooks({ title, pageNo, pageSize } = {}) {
  return apiGet("/api/books", { title, pageNo, pageSize });
}

// 도서 상세 — GET /api/books/{isbn13}
/** @returns {Promise<import("./types").Book>} */
export function getBook(isbn13) {
  return apiGet(`/api/books/${encodeURIComponent(isbn13)}`);
}
