import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchDashboardOutpatient,
  fetchDashboardOverview,
  fetchDashboardPharmacyAlerts,
  fetchDashboardQueuePressure,
  fetchDashboardRevenue,
} from '../api/hospital'
import DashboardPage from './DashboardPage.vue'

vi.mock('../api/hospital', () => ({
  fetchDashboardOverview: vi.fn().mockResolvedValue({
    registrationCount: 30,
    completedCount: 18,
    completionRate: 0.6,
    pendingPaymentCount: 12,
    netRevenue: 1000,
    queueWaiting: 4,
  }),
  fetchDashboardOutpatient: vi.fn().mockResolvedValue({
    total: 30,
    booked: 4,
    checkedIn: 5,
    inVisit: 3,
    completed: 18,
    noShow: 0,
    cancelled: 0,
    departmentLoad: [{ departmentName: '内科', registrationCount: 12, waitingCount: 3, completionRate: 0.75 }],
  }),
  fetchDashboardRevenue: vi.fn().mockResolvedValue({ total: 1000, trend: [{ date: '2026-07-14', amount: 1000 }] }),
  fetchDashboardPharmacyAlerts: vi.fn().mockResolvedValue({ total: 0, critical: 0, items: [] }),
  fetchDashboardQueuePressure: vi.fn().mockResolvedValue({ totalWaiting: 4, items: [] }),
}))

const elementStubs = {
  'el-button': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
  'el-date-picker': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<input data-test="date-range" :value="modelValue?.join(\',\')" />',
  },
  'el-form': { template: '<form><slot /></form>' },
  'el-form-item': { template: '<label><slot /></label>' },
  'el-input': {
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: '<input :data-test="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  'el-table': { props: ['data'], template: '<div><slot /></div>' },
  'el-table-column': { template: '<div />' },
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-14T10:00:00+08:00'))
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders operations dashboard sections', async () => {
    const wrapper = mount(DashboardPage, {
      global: {
        stubs: elementStubs,
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('启胜医院运营总览')
    expect(wrapper.text()).toContain('门诊漏斗')
    expect(wrapper.text()).toContain('队列压力')
    expect(wrapper.text()).toContain('收入趋势')
    expect(wrapper.text()).toContain('科室负载')
    expect(wrapper.text()).toContain('药房库存预警')
    expect(wrapper.text()).toContain('待办事项')
  })

  it('loads dashboard widgets with today filters by default', async () => {
    mount(DashboardPage, { global: { stubs: elementStubs } })
    await flushPromises()

    const todayParams = { startDate: '2026-07-14', endDate: '2026-07-14' }
    expect(fetchDashboardOverview).toHaveBeenCalledWith(todayParams)
    expect(fetchDashboardOutpatient).toHaveBeenCalledWith(todayParams)
    expect(fetchDashboardRevenue).toHaveBeenCalledWith(todayParams)
    expect(fetchDashboardPharmacyAlerts).toHaveBeenCalledWith(todayParams)
    expect(fetchDashboardQueuePressure).toHaveBeenCalledWith(todayParams)
  })

  it('passes organization filters when querying', async () => {
    const wrapper = mount(DashboardPage, { global: { stubs: elementStubs } })
    await flushPromises()

    await wrapper.find('[data-test="院区ID"]').setValue('campus-1')
    await wrapper.find('[data-test="科室ID"]').setValue('department-1')
    await wrapper.find('[data-test="医生ID"]').setValue('doctor-1')
    await wrapper.findAll('button').find((button) => button.text() === '查询')?.trigger('click')
    await flushPromises()

    expect(fetchDashboardOverview).toHaveBeenLastCalledWith({
      startDate: '2026-07-14',
      endDate: '2026-07-14',
      campusId: 'campus-1',
      departmentId: 'department-1',
      doctorId: 'doctor-1',
    })
  })
})
