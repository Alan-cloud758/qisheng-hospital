import { describe, expect, it } from 'vitest'
import { routes } from './index'

describe('admin routes', () => {
  it('contains login and dashboard routes', () => {
    expect(routes.some((route) => route.path === '/login')).toBe(true)
    expect(routes.some((route) => route.path === '/')).toBe(true)
  })
})
