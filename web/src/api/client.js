// 백엔드(Spring) 호출의 공통 처리. 컴포넌트에서 fetch를 직접 쓰지 말고 src/api의 함수를 쓴다.
// TODO: API_URL은 NEXT_PUBLIC_이 아니라 서버에서만 읽힌다. 대출 가능 여부처럼
//       클라이언트에서 불러야 하는 호출이 생기면 Route Handler 프록시 등으로 바꾼다.
const API_URL = process.env.API_URL;

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

export async function apiGet(path, params, init) {
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

  return response.json();
}
