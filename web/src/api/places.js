/*
 * 장소 검색 (동·구·역 이름 → 좌표). 기준 위치를 고를 때 쓴다.
 * 결과 주소는 동 단위까지만 (정확한 주소를 저장하지 않음).
 *
 * TODO: 백엔드에 지오코딩 API가 생기면 아래 샘플을 지우고 apiGet으로 교체.
 *       예) GET /api/places?q=부평역 → [{ name, address, latitude, longitude }]
 *       (카카오 로컬 등 외부 키는 백엔드에만 둔다. 프론트에서 직접 부르지 않음)
 */

/** @typedef {{ name: string, address: string, latitude: number, longitude: number }} Place */

const SAMPLE_PLACES = [
    { name: '망원동', address: '서울 마포구 망원동', latitude: 37.5556, longitude: 126.9019 },
    { name: '서교동', address: '서울 마포구 서교동', latitude: 37.553, longitude: 126.919 },
    { name: '홍대입구역', address: '서울 마포구 동교동', latitude: 37.5572, longitude: 126.9245 },
    { name: '신촌역', address: '서울 서대문구 창천동', latitude: 37.5551, longitude: 126.9369 },
    { name: '태평로1가', address: '서울 중구 태평로1가', latitude: 37.5663, longitude: 126.9779 },
    { name: '서울역', address: '서울 중구 봉래동2가', latitude: 37.5547, longitude: 126.9707 },
    { name: '역삼동', address: '서울 강남구 역삼동', latitude: 37.5007, longitude: 127.0365 },
    { name: '강남역', address: '서울 강남구 역삼동', latitude: 37.4979, longitude: 127.0276 },
    { name: '잠실동', address: '서울 송파구 잠실동', latitude: 37.5112, longitude: 127.082 },
    { name: '잠실역', address: '서울 송파구 잠실동', latitude: 37.5133, longitude: 127.1001 },
    { name: '신림동', address: '서울 관악구 신림동', latitude: 37.484, longitude: 126.929 },
    { name: '상계동', address: '서울 노원구 상계동', latitude: 37.656, longitude: 127.064 },
    { name: '부평동', address: '인천 부평구 부평동', latitude: 37.492, longitude: 126.723 },
    { name: '부평역', address: '인천 부평구 부평동', latitude: 37.4895, longitude: 126.7245 },
    { name: '송도동', address: '인천 연수구 송도동', latitude: 37.382, longitude: 126.656 },
    { name: '수원역', address: '경기 수원시 팔달구 매산로1가', latitude: 37.2659, longitude: 127.0 },
    { name: '정자동', address: '경기 성남시 분당구 정자동', latitude: 37.367, longitude: 127.108 },
    { name: '우동', address: '부산 해운대구 우동', latitude: 35.163, longitude: 129.163 },
];

const MAX_RESULTS = 10;

/** @returns {Promise<Place[]>} */
export async function searchPlaces(query) {
    const q = query.replace(/\s+/g, '');
    if (!q) return [];
    return SAMPLE_PLACES.filter(
        (place) => place.name.includes(q) || place.address.replace(/\s+/g, '').includes(q),
    ).slice(0, MAX_RESULTS);
}
