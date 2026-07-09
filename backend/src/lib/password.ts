import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(':')

  if (!salt || !expected) {
    return false
  }

  const actual = createHash('sha256').update(`${salt}:${password}`).digest('hex')

  if (actual.length !== expected.length) {
    return false
  }

  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
}
