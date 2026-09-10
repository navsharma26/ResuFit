/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/gap-analysis',
        destination: 'http://localhost:5001/api/gap-analysis'
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*'
      }
    ];
  }
};

export default nextConfig;
