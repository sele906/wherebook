import { ApiError } from '@/api';

/*
 * 빌릴 책 추가·빼기가 실패했을 때 보여줄 문구. 책 상세·검색 결과·빌릴 책 화면이 같은 말을 쓴다.
 * 요청이 서버에 닿지 않았으면(ApiError가 아니거나 status 0) 인터넷 연결을, 서버가 오류로 답했으면 잠시 후 다시 시도를 안내.
 * action: 'add' | 'remove'
 */
const MESSAGES = {
    add: {
        offline: '빌릴 책에 추가하지 못했어요. 인터넷 연결을 확인해 주세요.',
        failed: '빌릴 책에 추가하지 못했어요. 잠시 후 다시 시도해 주세요.',
    },
    remove: {
        offline: '빌릴 책에서 빼지 못했어요. 인터넷 연결을 확인해 주세요.',
        failed: '빌릴 책에서 빼지 못했어요. 잠시 후 다시 시도해 주세요.',
    },
};

export function borrowListErrorMessage(action, error) {
    const offline = !(error instanceof ApiError) || error.status === 0;
    return MESSAGES[action][offline ? 'offline' : 'failed'];
}
