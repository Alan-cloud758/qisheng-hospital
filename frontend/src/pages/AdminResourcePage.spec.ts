import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAdminResource, fetchAdminResource } from '../api/hospital'
import AdminResourcePage from './AdminResourcePage.vue'

vi.mock('../api/hospital', () => ({
  fetchAdminResource: vi.fn().mockResolvedValue({ items: [], pagination: { page: 1, pageSize: 20, total: 0 } }),
  createAdminResource: vi.fn().mockResolvedValue({}),
  updateAdminResource: vi.fn(),
  toggleAdminResource: vi.fn(),
}))

function mountPage() {
  return mount(AdminResourcePage, {
    props: {
      title: '科室管理',
      resource: 'departments',
      columns: [{ key: 'name', label: '名称' }],
      fields: [{ key: 'name', label: '名称', required: true }],
    },
    global: {
      directives: {
        loading: {},
      },
      stubs: {
        'el-button': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
        'el-input': { props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
        'el-input-number': { template: '<input />' },
        'el-table': { template: '<div><slot /></div>' },
        'el-table-column': { template: '<div />' },
        'el-pagination': { template: '<div />' },
        'el-dialog': { template: '<div><slot /><slot name="footer" /></div>' },
        'el-form': { template: '<form><slot /></form>' },
        'el-form-item': { template: '<label><slot /></label>' },
      },
    },
  })
}

describe('AdminResourcePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchAdminResource).mockResolvedValue({ items: [], pagination: { page: 1, pageSize: 20, total: 0 } })
    vi.mocked(createAdminResource).mockResolvedValue({})
  })

  it('renders search and create controls', () => {
    const wrapper = mountPage()

    expect(wrapper.text()).toContain('科室管理')
    expect(wrapper.text()).toContain('新增')
    expect(wrapper.text()).toContain('搜索')
  })

  it('passes keyword when searching', async () => {
    const wrapper = mountPage()
    const input = wrapper.find('input')

    await input.setValue('内科')
    await wrapper.findAll('button').find((button) => button.text() === '搜索')?.trigger('click')

    expect(fetchAdminResource).toHaveBeenLastCalledWith('departments', { keyword: '内科', page: 1, pageSize: 20 })
  })

  it('creates a resource from dialog form values', async () => {
    const wrapper = mountPage()

    await wrapper.findAll('button').find((button) => button.text() === '新增')?.trigger('click')
    await wrapper.findAll('input')[1].setValue('测试科室')
    await wrapper.findAll('button').find((button) => button.text() === '保存')?.trigger('click')

    expect(createAdminResource).toHaveBeenCalledWith('departments', expect.objectContaining({ name: '测试科室' }))
  })
})
