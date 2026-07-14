export type ProviderPaymentResult = { providerTradeNo: string; status: 'SUCCESS'; raw: Record<string, unknown> }
export type ProviderRefundResult = { providerRefundNo: string; status: 'SUCCESS'; raw: Record<string, unknown> }

export interface PaymentProvider {
  pay(input: { orderNo: string; amount: string; payMethod: string }): Promise<ProviderPaymentResult>
  refund(input: { refundNo: string; amount: string; reason: string }): Promise<ProviderRefundResult>
  query(transactionNo: string): Promise<{ transactionNo: string; status: 'SUCCESS' | 'NOT_FOUND' }>
}

export class MockPaymentProvider implements PaymentProvider {
  async pay(input: { orderNo: string; amount: string; payMethod: string }) {
    return { providerTradeNo: `MOCKPAY-${input.orderNo}`, status: 'SUCCESS' as const, raw: input }
  }

  async refund(input: { refundNo: string; amount: string; reason: string }) {
    return { providerRefundNo: `MOCKREFUND-${input.refundNo}`, status: 'SUCCESS' as const, raw: input }
  }

  async query(transactionNo: string) {
    return { transactionNo, status: 'SUCCESS' as const }
  }
}
