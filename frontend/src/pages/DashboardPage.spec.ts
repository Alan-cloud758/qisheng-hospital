import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import DashboardPage from './DashboardPage.vue'

vi.mock('../api/hospital', () => ({
  fetchDashboard: vi.fn().mockResolvedValue({
    departmentCount: 16,
    doctorCount: 24,
    registrationCount: 30,
    pendingPaymentCount: 12,
    prescriptionCount: 20,
    patientCount: 16,
  }),
}))

describe('DashboardPage', () => {
  it('renders hospital dashboard title', () => {
    const wrapper = mount(DashboardPage, {
      global: {
        stubs: ['el-button', 'el-table', 'el-table-column'],
      },
    })

    expect(wrapper.text()).toContain('启胜医院运营总览')
  })
})
