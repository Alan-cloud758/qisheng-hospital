import { Router } from 'express'
import { z } from 'zod'
import { createToken, auth } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { verifyPassword } from '../lib/password'
import type { AuthUser } from '../types/auth'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const authRouter = Router()

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({
      where: { username: input.username },
      include: { roles: { include: { role: true } } },
    })

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      res.status(401).json({ message: '用户名或密码错误' })
      return
    }

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      roles: user.roles.map((item) => item.role.code),
    }
    const token = createToken(authUser)

    res.json({ token, user: authUser })
  } catch (error) {
    next(error)
  }
})

authRouter.get('/me', auth, (req, res) => {
  res.json({ user: req.user })
})
