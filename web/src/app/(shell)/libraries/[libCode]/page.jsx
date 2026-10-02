import { notFound } from "next/navigation";
import { ApiError, getLibrary } from "@/api";

export default async function LibraryPage({params}) {
  const { libCode } = await params;

  let library;
  let errorStatus = null;
  try {
    library = await getLibrary(libCode);
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
      <h1>도서관 상세</h1>

      <section>
        <h2>도서관 정보</h2>

        <p>도서관코드: {library.libCode}</p>
        <p>도서관명: {library.name}</p>
        <p>주소: {library.address}</p>
        <p>전화번호: {library.tel}</p>
        <p>휴관일: {library.closedDays}</p>
        <p>보유 도서: {library.bookCount}권</p>

        <a href={library.homepage}>
          도서관 홈페이지
        </a>
      </section>
    </main>
  );
}