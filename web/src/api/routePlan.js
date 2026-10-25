import { apiPost } from "./client";

// 한 번에 동선을 짤 수 있는 책 수 — 백엔드 RouteRequest isbns @Size(max = 30)
export const ROUTE_ISBN_LIMIT = 30;

// 동선 추천 — POST /api/route
// radius 단위 m(기본 1000, 최대 5000). 빼면 백엔드 기본값으로 계산되니, 화면에 보이는 값을 항상 넘긴다.
// 책마다·도서관마다 대출 여부를 외부 API로 조회해서 느리다 → 화면을 막지 않게 Suspense 안에서 부른다.
// 대출 상태는 매번 달라서 캐시하지 않는다.
/** @returns {Promise<import("./types").RouteResponse>} */
export function planRoute({ isbns, latitude, longitude, radius }) {
  return apiPost("/api/route", undefined, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isbns, latitude, longitude, radius }),
    cache: "no-store",
  });
}
