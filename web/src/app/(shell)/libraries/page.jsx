import { notFound } from "next/navigation";
import { ApiError, searchLibraries } from "@/api";

export default async function LibraryPage({ searchParams }) {
    const params = await searchParams;

    let results;
    let errorStatus = null;
    try {
        results = await searchLibraries({ keyword: params.keyword });
    } catch (e) {
        if (!(e instanceof ApiError)) throw e;
        errorStatus = e.status;
    }

    // Spring에서 404가 오면 Next의 404 페이지로 이동
    if (errorStatus === 404) {
        notFound();
    }

    if (errorStatus !== null) {
        return (
        <main>
            <h1>도서관 조회 실패</h1>
            <p>status: {errorStatus}</p>
        </main>
        );
    }

    return (
        <main>
            <h1>도서관 검색</h1>

            {results.libraries?.map(lib => (
                <div key={lib.libCode}>
                    <p>도서관코드: {lib.libCode}</p>
                    <p>도서관명: {lib.name}</p>
                    <p>주소: {lib.address}</p>
                    <p>위도: {lib.latitude}</p>
                    <p>경도: {lib.longitude}</p>
                    <p>전화번호: {lib.tel}</p>
                    <p>팩스: {lib.fax}</p>
                    <p>홈페이지: {lib.homepage}</p>
                    <p>휴관일: {lib.closedDays}</p>
                    <p>운영일: {lib.operatingTime}</p>
                    
                    <p>지역코드: {lib.dtlRegionCode}</p>
                    <p>거리: {lib.distance}</p>
                </div>
            ))}
        </main>
    );
}