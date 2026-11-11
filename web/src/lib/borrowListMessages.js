import { ApiError } from '@/api';

/*
 * 빌릴 책 추가·빼기가 실패했을 때 보여줄 문구. 책 상세·검색 결과·빌릴 책 화면이 같은 말을 쓴다.
 * 요청이 서버에 닿지 않았으면(ApiError가 아니거나 status 0) 인터넷 연결을, 서버가 오류로 답했으면 잠시 후 다시 시도를 안내.
 * 추가가 409면 최대 권수(백엔드 BorrowListService, 14권)를 넘은 것 → 다시 시도해도 안 되므로 빼고 추가하라고 안내.
 * 문구는 서버 message 대신 여기 것을 쓴다 (영어 전환 때 프론트에서 옮기도록).
 * action: 'add' | 'remove'
 */
const MAX_BORROW_LIST = 14; // 백엔드 BorrowListService의 한도와 같아야 한다

const MESSAGES = {
    add: {
        offline: '빌릴 책에 추가하지 못했어요. 인터넷 연결을 확인해 주세요.',
        failed: '빌릴 책에 추가하지 못했어요. 잠시 후 다시 시도해 주세요.',
        full: `빌릴 책은 최대 ${MAX_BORROW_LIST}권까지 담을 수 있어요. 다른 책을 빼고 추가해 주세요.`,
    },
    remove: {
        offline: '빌릴 책에서 빼지 못했어요. 인터넷 연결을 확인해 주세요.',
        failed: '빌릴 책에서 빼지 못했어요. 잠시 후 다시 시도해 주세요.',
    },
};

export function borrowListErrorMessage(action, error) {
    const offline = !(error instanceof ApiError) || error.status === 0;
    if (offline) return MESSAGES[action].offline;
    if (action === 'add' && error.status === 409) return MESSAGES.add.full;
    return MESSAGES[action].failed;
}
