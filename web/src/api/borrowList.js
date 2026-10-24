import { apiDelete, apiGet, apiPost } from "./client";

/*
 * 빌릴 책 — /api/borrow-list
 * 브라우저에서 부른다. 게스트 쿠키(HttpOnly)를 브라우저가 알아서 붙이고 받아 두므로
 * 프론트 코드는 사용자 ID를 읽지도, 넘기지도 않는다.
 * 서버에서 부르면 쿠키가 자동으로 붙지 않는다 → getBorrowList만 init.headers로 쿠키를 전달해서 쓴다.
 */

// 게스트 쿠키 이름. 백엔드 GuestCookies.NAME과 같아야 한다
export const GUEST_COOKIE = "userId";

// 빌릴 책 목록 — GET /api/borrow-list
// 최근에 추가한 순. 아직 게스트가 아니면(쿠키 없음) 빈 배열
/** @returns {Promise<import("./types").BorrowListItem[]>} */
export function getBorrowList(init) {
  return apiGet("/api/borrow-list", undefined, { cache: "no-store", ...init });
}

// 빌릴 책에 추가 — POST /api/borrow-list/{isbn13}
// 처음 추가하면 백엔드가 게스트를 만들고 쿠키를 내려준다. 이미 있는 책이면 그대로 성공.
// 없는 ISBN이면 400 (ApiError)
// TODO: 최대 권수 제한은 백엔드에 아직 없음
export function addToBorrowList(isbn13) {
  return apiPost(`/api/borrow-list/${encodeURIComponent(isbn13)}`);
}

// 빌릴 책에서 빼기 — DELETE /api/borrow-list/{isbn13}
// 목록에 없는 책이거나 아직 게스트가 아니어도 그대로 성공
export function removeFromBorrowList(isbn13) {
  return apiDelete(`/api/borrow-list/${encodeURIComponent(isbn13)}`);
}
