import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs', 'nodemailer', 'otplib', 'qrcode'],

}

export default nextConfig
