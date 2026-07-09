import { defineConfig } from 'vitest/config'
import uniPlugin from '@dcloudio/vite-plugin-uni'

const uni = typeof uniPlugin === 'function' ? uniPlugin : (uniPlugin as { default: () => unknown }).default

export default defineConfig({
  plugins: [uni()],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts'],
  },
})
