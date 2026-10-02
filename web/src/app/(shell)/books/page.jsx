import { notFound } from "next/navigation";
import { ApiError, searchBooks } from "@/api";

export default async function BookPage({ searchParams }) {
    const params = await searchParams;

    let results;
    let errorStatus = null;
    try {
        results = await searchBooks({ title: params.title });
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
            <h1>책 조회 실패</h1>
            <p>status: {errorStatus}</p>
        </main>
        );
    }

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