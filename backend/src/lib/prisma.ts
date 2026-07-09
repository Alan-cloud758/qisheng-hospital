import { PrismaClient } from '../generated/prisma/client'
import { createMariaDbAdapter } from './prisma-adapter'

declare global {
  var __qishengPrisma: PrismaClient | undefined
}

export const prisma = globalThis.__qishengPrisma ?? new PrismaClient({ adapter: createMariaDbAdapter() })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__qishengPrisma = prisma
}
