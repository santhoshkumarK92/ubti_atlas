/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Heavy Node-only libraries stay out of the bundle.
  serverExternalPackages: ['firebase-admin', 'pptxgenjs', 'unpdf', 'jszip'],
  experimental: {
    serverActions: { bodySizeLimit: '8mb' },
  },
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  async headers() {
    return [
      {
        source: '/for/:slug*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
