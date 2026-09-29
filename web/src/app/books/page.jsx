

export default async function BookPage({ searchParams }) {
    const params = await searchParams;

    const query = new URLSearchParams({
        title: params.title ?? ''
    });

    const response = await fetch(
        `${process.env.API_URL}/api/books?${query}`
    );

    // Spring에서 404가 오면 Next의 404 페이지로 이동
    if (response.status === 404) {
    notFound();
    }

    if (!response.ok) {
        return (
        <main>
            <h1>책 조회 실패</h1>
            <p>status: {response.status}</p>
        </main>
        );
    }

    const results = await response.json();

    return (
        <main>
            <h1>책 검색</h1>

            {results.books?.map(book => (
                <div key={book.isbn13}>
                    <p>isbn: {book.isbn13}</p>
                    <p>제목: {book.title}</p>
                    <p>저자: {book.authors}</p>
                    <p>출판사: {book.publisher}</p>
                    <p>출판연도: {book.publicationYear}</p>
                    <p>이미지: {book.imageUrl}</p>

                    <p>대출횟수: {book.loanCount}</p>
                </div>
            ))}
        </main>
    );
}