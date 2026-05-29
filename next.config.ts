import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs', 'nodemailer', 'otplib', 'qrcode', 'speakeasy'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Previene que el navegador haga MIME sniffing
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          // Previene clickjacking
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          // Fuerza HTTPS por 1 año, incluye subdominios
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // No enviar el referrer completo fuera del sitio
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          // Desactivar features peligrosas
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          // Forzar XSS protection en navegadores legacy
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          // CSP estricto
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // unsafe-eval requerido por Next.js dev
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.anthropic.com https://api.openai.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
