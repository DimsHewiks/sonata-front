import axios, { type InternalAxiosRequestConfig } from 'axios'

import { getApiBaseUrl } from '@/shared/config/api'
import {
  clearAccessToken,
  extractAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/shared/auth/token'

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
})

const refreshClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
})

let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = async (): Promise<string | null> => {
  const response = await refreshClient.post('/refresh')
  const accessToken = extractAccessToken(response.headers['authorization'])
  if (accessToken) {
    setAccessToken(accessToken)
    return accessToken
  }

  return null
}

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error)
    }

    const status = error.response?.status
    const config = error.config as RetryableRequestConfig | undefined

    if (status !== 401 || !config || config._retry) {
      return Promise.reject(error)
    }

    config._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null
        })
      }

      const refreshedToken = await refreshPromise
      if (!refreshedToken) {
        clearAccessToken()
        return Promise.reject(error)
      }

      return apiClient(config)
    } catch (refreshError) {
      clearAccessToken()
      return Promise.reject(refreshError)
    }
  },
)
