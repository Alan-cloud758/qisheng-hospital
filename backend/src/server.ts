import type { Server } from 'node:http'
import { createApp } from './app'
import { env } from './config/env'

function setupGracefulShutdown(server: Server) {
  let shuttingDown = false

  const shutdown = (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`Received ${signal}, shutting down gracefully...`)
    server.close((error) => {
      if (error) {
        console.error('HTTP server close failed:', error)
        process.exit(1)
      }
      process.exit(0)
    })
  }

  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
}

const server = createApp().listen(env.PORT, () => {
  console.log(`Qisheng Hospital backend listening on ${env.PORT}`)
})

setupGracefulShutdown(server)
