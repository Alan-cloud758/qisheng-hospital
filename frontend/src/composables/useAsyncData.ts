import { ref } from 'vue'

export function useAsyncData<T>(fetcher: () => Promise<T>) {
  const data = ref<T | null>(null) as { value: T | null }
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function execute() {
    loading.value = true
    error.value = null
    try {
      data.value = await fetcher()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '请求失败'
      error.value = message
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, execute }
}
