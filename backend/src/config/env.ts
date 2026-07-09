import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  AUTH_SECRET: z.string().min(32).default('development-secret-at-least-32-characters'),
  DATABASE_URL: z.string().min(1),
  REDIS_ENABLED: z.coerce.boolean().default(false),
  REDIS_URL: z.string().default('redis://localhost:6379'),
})

export const env = envSchema.parse(process.env)
