import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import type { AuthUser } from '../types/auth'

const tokenStore = new Map<string, AuthUser>()

export function createToken(user: AuthUser) {
  const token = Buffer.from(`${user.id}:${Date.now()}:${Math.random()}`).toString('base64url')
  tokenStore.set(token, user)
  return token
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
  const user = tokenStore.get(token)

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
