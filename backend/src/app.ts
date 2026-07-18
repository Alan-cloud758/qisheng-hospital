import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import { setupSwagger } from './lib/swagger'
import { adminRouter } from './routes/admin'
import { authRouter } from './routes/auth'
import { labRouter } from './routes/lab'
import { miniRouter } from './routes/mini'
import { nurseRouter } from './routes/nurse'
import { publicRouter } from './routes/public'
import { radiologyRouter } from './routes/radiology'
import { staffRouter } from './routes/staff'
import { analyticsRouter, consumableRouter, examRouter, nursingRouter, patientEnhancedRouter, surgeryRouter } from './routes/new-modules'
import { ServiceError } from './services/service-error'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
  app.use(express.json())

  // Rate limiting: 100 requests per 15 minutes per IP (skip in test)
  if (env.NODE_ENV !== 'test') {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: '请求过于频繁，请稍后再试' },
    })
    app.use('/api/', limiter)

    // Stricter limit for auth endpoints
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      message: { message: '登录尝试过于频繁，请15分钟后再试' },
    })
    app.use('/api/auth/login', authLimiter)
  }

  app.use('/api/auth', authRouter)
  app.use('/api/public', publicRouter)
  app.use('/api/mini', miniRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/staff/nurse', nurseRouter)
  app.use('/api/staff/lab', labRouter)
  app.use('/api/staff/radiology', radiologyRouter)
  app.use('/api/staff', staffRouter)
  app.use('/api/admin/exam', examRouter)
  app.use('/api/admin/surgery', surgeryRouter)
  app.use('/api/staff/nursing', nursingRouter)
  app.use('/api/admin/consumables', consumableRouter)
  app.use('/api/admin/analytics', analyticsRouter)
  app.use('/api/mini/enhanced', patientEnhancedRouter)

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true, service: 'qisheng-hospital-backend' })
  })

  app.get('/readyz', (_req, res) => {
    if (env.NODE_ENV === 'production') {
      res.json({ ok: true })
    } else {
      res.json({ ok: true, database: env.DATABASE_URL ? 'configured' : 'missing' })
    }
  })

  setupSwagger(app)

  // Global error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ServiceError) {
      res.status(err.statusCode).json({ message: err.message })
      return
    }

    const message = err instanceof Error ? err.message : '服务器内部错误'
    const stack = env.NODE_ENV === 'development' && err instanceof Error ? err.stack : undefined

    console.error('[UnhandledError]', err)

    res.status(500).json({
      message: env.NODE_ENV === 'production' ? '服务器内部错误' : message,
      ...(stack ? { stack } : {}),
    })
  })

  return app
}
