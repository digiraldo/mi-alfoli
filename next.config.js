/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Removido COOP Header para limpiar la consola de Google PostMessage Blocks
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
