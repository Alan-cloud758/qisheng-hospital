import axios from 'axios'
import { ElMessage } from 'element-plus'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('qisheng_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem('qisheng_token')
        localStorage.removeItem('qisheng_user')

        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      if (!error.response) {
        ElMessage.error('网络连接失败，请检查网络状态')
      } else if (error.response.status >= 500) {
        ElMessage.error('服务器错误，请稍后重试')
      } else if (error.response.status >= 400) {
        const data = error.response.data as Record<string, unknown>
        const msg = typeof data?.message === 'string' ? data.message : '请求失败'
        ElMessage.warning(msg)
      }
    }

    return Promise.reject(error)
  },
)
