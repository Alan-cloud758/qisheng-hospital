import { describe, expect, it } from 'vitest'
import { routes } from './index'

describe('admin routes', () => {
  it('contains login, dashboard, and complete outpatient module routes', () => {
    expect(routes.some((route) => route.path === '/login')).toBe(true)
    const shell = routes.find((route) => route.path === '/')
    expect(shell).toBeTruthy()
    const childPaths = shell?.children?.map((route) => route.path) ?? []

    expect(childPaths).toContain('')
    expect(childPaths).toContain('patients')
    expect(childPaths).toContain('pharmacy')
    expect(childPaths).toContain('audit')
    expect(childPaths).toContain('dictionaries')
  })

  it('uses a boolean control for drug batch management', () => {
    const shell = routes.find((route) => route.path === '/')
    const drugsRoute = shell?.children?.find((route) => route.path === 'drugs')
    const fields = drugsRoute?.props && typeof drugsRoute.props === 'object' && 'fields' in drugsRoute.props ? drugsRoute.props.fields : []

    expect(fields).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'requiresBatch', type: 'boolean' })]))
  })
})
