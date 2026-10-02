// 주소에 들어오는 식별자 형식 검사. 페이지와 proxy가 같이 쓴다.

// ISBN13: 978 또는 979로 시작하는 13자리 숫자
export function isValidIsbn13(value) {
    return /^97[89]\d{10}$/.test(value);
}

// 정보나루 도서관 코드: 숫자만 (예: 111314)
export function isValidLibCode(value) {
    return /^\d{1,12}$/.test(value);
}
