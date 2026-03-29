/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['zlib'],
  experimental: {
    serverComponentsExternalPackages: ['zlib'],
  },
};

export default nextConfig;
