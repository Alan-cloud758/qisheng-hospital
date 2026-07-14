import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { adminRouter } from './routes/admin'
import { authRouter } from './routes/auth'
import { labRouter } from './routes/lab'
import { miniRouter } from './routes/mini'
import { nurseRouter } from './routes/nurse'
import { publicRouter } from './routes/public'
import { radiologyRouter } from './routes/radiology'
import { staffRouter } from './routes/staff'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  app.use('/api/auth', authRouter)
  app.use('/api/public', publicRouter)
  app.use('/api/mini', miniRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/staff/nurse', nurseRouter)
  app.use('/api/staff/lab', labRouter)
  app.use('/api/staff/radiology', radiologyRouter)
  app.use('/api/staff', staffRouter)

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true, service: 'qisheng-hospital-backend' })
  })

  app.get('/readyz', (_req, res) => {
    res.json({ ok: true, database: process.env.DATABASE_URL ? 'configured' : 'missing' })
  })

  return app
}
