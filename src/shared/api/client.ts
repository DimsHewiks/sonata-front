import axios, { type InternalAxiosRequestConfig } from 'axios'

import { getApiBaseUrl } from '@/shared/config/api'
import { getAccessToken } from '@/shared/auth/token'

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = getAccessToken()
    if (accessToken) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
  },
)
