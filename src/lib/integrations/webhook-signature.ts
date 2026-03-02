import crypto from 'node:crypto'

export function verifyHmacSignature(payload: string, signature: string, secret: string) {
  const digest = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  const a = Buffer.from(digest)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
