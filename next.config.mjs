/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'images.isbndb.com',
      pathname: '/covers/**',
    }]
  },
  reactStrictMode: true,
};

export default nextConfig;
