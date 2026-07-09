import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true, service: 'qisheng-hospital-backend' })
  })

  app.get('/readyz', (_req, res) => {
    res.json({ ok: true, database: process.env.DATABASE_URL ? 'configured' : 'missing' })
  })

  return app
}
