/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 't.me' },
      { protocol: 'https', hostname: '*.telegram.org' },
    ],
  },
  // Allow Telegram Mini App to embed the app
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://web.telegram.org https://t.me" },
        ],
      },
    ]
  },
}

export default nextConfig;
