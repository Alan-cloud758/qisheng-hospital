import { createPinia, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AuthUser } from '../api/hospital'
import { login as loginRequest } from '../api/hospital'

export const pinia = createPinia()

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('qisheng_token') || '')
  const user = ref<AuthUser | null>(
    localStorage.getItem('qisheng_user') ? JSON.parse(localStorage.getItem('qisheng_user') || 'null') : null,
  )

  const isAuthenticated = computed(() => Boolean(token.value))

  async function login(username: string, password: string) {
    const result = await loginRequest(username, password)
    token.value = result.token
    user.value = result.user
    localStorage.setItem('qisheng_token', result.token)
    localStorage.setItem('qisheng_user', JSON.stringify(result.user))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('qisheng_token')
    localStorage.removeItem('qisheng_user')
  }

  return { token, user, isAuthenticated, login, logout }
})
