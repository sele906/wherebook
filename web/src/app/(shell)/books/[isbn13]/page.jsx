import { notFound } from "next/navigation";
import { ApiError, getBook } from "@/api";

export default async function BookPage({params}) {
  const { isbn13 } = await params;

  let book;
  let errorStatus = null;
  try {
    book = await getBook(isbn13);
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
      <h1>책 상세</h1>

      <section>
        <h2>책 상세 정보</h2>

        <p>isbn: {book.isbn13}</p>
        <p>책제목: {book.title}</p>
        <p>저자: {book.authors}</p>
        <p>출판사: {book.publisher}</p>
        <p>출판연도: {book.publicationYear}</p>
        <p>청구기호: {book.classNo}</p>
        <p>분류항목: {book.className}</p>
        <p>설명: {book.description}</p>
        <p>이미지: {book.imageUrl}</p>
      </section>
    </main>
  );
}