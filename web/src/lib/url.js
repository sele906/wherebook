// 정보나루 표지 주소 중 http:// 가 섞여 있어 https 페이지에서 막히지 않게 올림
export function toHttps(url) {
    return url?.replace(/^http:\/\//, 'https://');
}
