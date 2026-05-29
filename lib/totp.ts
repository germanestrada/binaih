import speakeasy from 'speakeasy'

export function generateTotpSecret(): string {
  return speakeasy.generateSecret({ length: 20 }).base32
}

export function verifyTotp(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  })
}

export function getTotpUri(email: string, secret: string, issuer = 'TVEO Admin'): string {
  return speakeasy.otpauthURL({
    secret,
    label:    encodeURIComponent(email),
    issuer,
    encoding: 'base32',
  })
}
