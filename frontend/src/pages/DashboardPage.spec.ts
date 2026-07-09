import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DashboardPage from './DashboardPage.vue'

describe('DashboardPage', () => {
  it('renders hospital dashboard title', () => {
    const wrapper = mount(DashboardPage)
    expect(wrapper.text()).toContain('启胜医院平台总览')
  })
})
