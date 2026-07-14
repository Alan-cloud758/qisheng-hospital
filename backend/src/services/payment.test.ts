import { describe, expect, it } from 'vitest'
import { assertCanCancelOrder, assertCanRefundOrder, createMockTransactionNo } from './payment'

describe('payment workflow rules', () => {
  it('allows cancellation only for pending orders', () => {
    expect(() => assertCanCancelOrder('PENDING')).not.toThrow()
    expect(() => assertCanCancelOrder('PAID')).toThrow('Only pending payment orders can be cancelled')
  })

  it('allows refund only for paid orders', () => {
    expect(() => assertCanRefundOrder('PAID')).not.toThrow()
    expect(() => assertCanRefundOrder('PENDING')).toThrow('Only paid payment orders can be refunded')
  })

  it('creates stable mock transaction number prefix', () => {
    expect(createMockTransactionNo('PAY', new Date('2026-07-14T00:00:00.000Z'))).toMatch(/^PAY20260714/)
  })
})
