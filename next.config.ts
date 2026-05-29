import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs', 'nodemailer', 'otplib', 'qrcode'],
  async redirects() {
    return [
      { source: '/', destination: '/login', permanent: false },
    ]
  },
}

export default nextConfig
