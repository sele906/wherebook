// 백엔드(Spring) 호출의 공통 처리. 컴포넌트에서 fetch를 직접 쓰지 말고 src/api의 함수를 쓴다.
// 서버에선 백엔드 주소로 바로 부르고, 브라우저에선 같은 사이트의 /api로 부른다
// (next.config.mjs rewrites가 백엔드로 넘김 → 게스트 쿠키가 자동으로 붙는다).
// API_URL은 NEXT_PUBLIC_이 아니라서 브라우저에선 읽히지 않는다.
const API_URL = typeof window === "undefined" ? process.env.API_URL : "";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status; // 네트워크 오류면 0
  }
}

// 값이 없는 파라미터는 빼고 쿼리스트링을 만든다
function toQuery(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }
  const str = query.toString();
  return str ? `?${str}` : "";
}

async function request(path, params, init) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}${toQuery(params)}`, init);
  } catch (e) {
    throw new ApiError(0, `서버에 연결하지 못했어요: ${e.message}`);
  }

  if (!response.ok) {
    // 백엔드 ErrorResponse { status, message }
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.message ?? response.statusText);
  }

  // 204 No Content 등 본문이 없으면 null
  if (response.status === 204) return null;
  return response.json();
}

export function apiGet(path, params, init) {
  return request(path, params, init);
}

export function apiPost(path, params, init) {
  return request(path, params, { ...init, method: "POST" });
}

export function apiDelete(path, params, init) {
  return request(path, params, { ...init, method: "DELETE" });
}
