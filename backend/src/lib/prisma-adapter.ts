import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { env } from '../config/env'

function getDatabaseUrl() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured')
  }

  return env.DATABASE_URL
}

export function createMariaDbAdapter() {
  const databaseUrl = new URL(getDatabaseUrl())

  return new PrismaMariaDb({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || '3306'),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.replace(/^\//, ''),
    ssl: {
      rejectUnauthorized: false,
    },
    connectTimeout: 10000,
    acquireTimeout: 10000,
    multipleStatements: true,
  })
}
