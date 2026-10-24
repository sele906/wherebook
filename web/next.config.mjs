/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,

  // 브라우저의 /api/* 요청을 백엔드(Render)로 대신 전달한다.
  // 브라우저 입장에선 같은 사이트라 게스트 쿠키(HttpOnly)가 이 도메인에 저장되고 요청마다 붙는다.
  // rewrites는 빌드할 때 읽히므로 Vercel에도 API_URL이 있어야 한다.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
