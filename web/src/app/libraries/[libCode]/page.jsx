import { notFound } from "next/navigation";

export default async function LibraryPage({params}) {
  const { libCode } = await params;

  const response = await fetch(
    `${process.env.API_URL}/api/libraries/${libCode}`
  );

  // Spring에서 404가 오면 Next의 404 페이지로 이동
  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    return (
      <main>
        <h1>도서관 조회 실패</h1>
        <p>status: {response.status}</p>
      </main>
    );
  }

  const library = await response.json();

  return (
    <main>
      <h1>도서관 상세</h1>

      <section>
        <h2>도서관 정보</h2>

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