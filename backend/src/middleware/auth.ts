import type { NextFunction, Request, Response } from 'express'
import { randomBytes } from 'node:crypto'
import { prisma } from '../lib/prisma'
import type { AuthUser } from '../types/auth'

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes

interface TokenEntry {
  user: AuthUser
  expiresAt: number
}

const tokenStore = new Map<string, TokenEntry>()

function cleanupExpiredTokens() {
  const now = Date.now()
  for (const [token, entry] of tokenStore) {
    if (entry.expiresAt <= now) {
      tokenStore.delete(token)
    }
  }
}

const cleanupTimer = setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL_MS)
cleanupTimer.unref()

export function createToken(user: AuthUser) {
  const token = randomBytes(32).toString('base64url')
  tokenStore.set(token, { user, expiresAt: Date.now() + TOKEN_TTL_MS })
  return token
}

export function revokeToken(token: string) {
  tokenStore.delete(token)
}

export function authUserFromHeader(header: string | undefined) {
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
  const entry = tokenStore.get(token)

  if (!entry) {
    return null
  }

  if (entry.expiresAt <= Date.now()) {
    tokenStore.delete(token)
    return null
  }

  return entry.user
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const user = authUserFromHeader(req.headers.authorization)

  if (!user) {
    res.status(401).json({ message: '请先登录' })
    return
  }

  req.user = user
  next()
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.roles.some((role) => roles.includes(role))) {
      res.status(403).json({ message: '没有权限访问该资源' })
      return
    }

    next()
  }
}

export async function loadAuthUser(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    roles: user.roles.map((item) => item.role.code),
  }
}
