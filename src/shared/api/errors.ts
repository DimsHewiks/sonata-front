import axios, { type AxiosError } from 'axios'

import type { ApiErrorPayload } from '@/shared/types/api'

const extractMessage = (payload: ApiErrorPayload): string | null => {
  if (typeof payload.message === 'string') {
    return payload.message
  }

  if (payload.message && typeof payload.message === 'object') {
    return payload.message.message ?? null
  }

  if (payload.error && typeof payload.error === 'object') {
    return payload.error.message ?? null
  }

  return null
}

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const axiosError = error as AxiosError<ApiErrorPayload>
    const payloadMessage = axiosError.response?.data
      ? extractMessage(axiosError.response.data)
      : null
    return (
      payloadMessage ||
      axiosError.message
    )
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Неизвестная ошибка'
}

export const isUnauthorizedError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 401
  }

  return false
}
