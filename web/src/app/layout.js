export const metadata = {
  title: "책어디 - 내 주변 도서관 책 찾기",
  description: "도서관 검색 서비스",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}