import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@seguros/ui', '@seguros/schemas'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;