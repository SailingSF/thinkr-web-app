/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/app/scheduler',
        destination: '/app/agents',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
