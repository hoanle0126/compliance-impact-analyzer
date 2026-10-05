/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@impactlens/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4201/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
