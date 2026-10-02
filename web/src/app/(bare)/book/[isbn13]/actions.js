'use server';

import { ApiError, getCallNumber, getLoanStatuses, LOAN_BATCH_SIZE } from '@/api';
import { isValidIsbn13, isValidLibCode } from '@/lib/ids';

/*
 * "더 보기"로 펼친 도서관 묶음의 대출 가능 여부를 한 번에 조회.
 * Server Function은 누구나 POST로 직접 부를 수 있으므로 입력을 검사하고
 * 한 번에 LOAN_BATCH_SIZE 곳까지만 받는다 (정보나루 호출량 보호).
 */
export async function loadLoanStatuses(isbn13, libCodes) {
    if (typeof isbn13 !== 'string' || !isValidIsbn13(isbn13)) {
        throw new Error('잘못된 ISBN');
    }
    if (
        !Array.isArray(libCodes) ||
        libCodes.length === 0 ||
        libCodes.length > LOAN_BATCH_SIZE ||
        !libCodes.every((code) => typeof code === 'string' && isValidLibCode(code))
    ) {
        throw new Error('잘못된 도서관 코드');
    }

    return getLoanStatuses(isbn13, libCodes);
}

/*
 * 소장 도서관 한 곳의 청구기호. 행을 펼칠 때 그 도서관 하나만 조회한다 (한꺼번에 부르지 않음).
 * 응답: { callNumber, shelfLocation, status: 'OK' | 'NOT_FOUND' | 'ERROR' }
 */
export async function loadCallNumber(isbn13, libCode) {
    if (typeof isbn13 !== 'string' || !isValidIsbn13(isbn13)) {
        throw new Error('잘못된 ISBN');
    }
    if (typeof libCode !== 'string' || !isValidLibCode(libCode)) {
        throw new Error('잘못된 도서관 코드');
    }

    try {
        return await getCallNumber(isbn13, libCode);
    } catch (e) {
        if (e instanceof ApiError) return { callNumber: null, shelfLocation: null, status: 'ERROR' };
        throw e;
    }
}
