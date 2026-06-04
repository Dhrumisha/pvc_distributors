/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables exposed to browser
  // Change NEXT_PUBLIC_API_URL in .env.local to point to your backend
  reactStrictMode: true,
  images: { domains: [] },
  // Produce a self-contained build for Docker (small runtime image).
  output: 'standalone',
};

module.exports = nextConfig;
