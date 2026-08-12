/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@seguros/ui', '@seguros/schemas'],
};

module.exports = nextConfig;
