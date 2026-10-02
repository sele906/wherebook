'use server';

import { getLoanStatuses, LOAN_BATCH_SIZE } from '@/api';

/*
 * "더 보기"로 펼친 도서관 묶음의 대출 가능 여부를 한 번에 조회.
 * Server Function은 누구나 POST로 직접 부를 수 있으므로 입력을 검사하고
 * 한 번에 LOAN_BATCH_SIZE 곳까지만 받는다 (정보나루 호출량 보호).
 */
export async function loadLoanStatuses(isbn13, libCodes) {
    if (typeof isbn13 !== 'string' || !/^97[89]\d{10}$/.test(isbn13)) {
        throw new Error('잘못된 ISBN');
    }
    if (
        !Array.isArray(libCodes) ||
        libCodes.length === 0 ||
        libCodes.length > LOAN_BATCH_SIZE ||
        !libCodes.every((code) => typeof code === 'string' && /^\d{1,12}$/.test(code))
    ) {
        throw new Error('잘못된 도서관 코드');
    }

    return getLoanStatuses(isbn13, libCodes);
}
