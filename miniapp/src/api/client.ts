const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

export async function request<T>(path: string, options: Partial<UniApp.RequestOptions> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url: baseUrl + path,
      success(response) {
        const status = response.statusCode || 0
        if (status >= 200 && status < 300) {
          resolve(response.data as T)
          return
        }

        reject(response.data)
      },
      fail: reject,
    })
  })
}
