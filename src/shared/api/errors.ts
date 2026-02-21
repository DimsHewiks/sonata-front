import axios, { type AxiosError } from 'axios'

import type { ApiErrorMessageObject, ApiErrorPayload } from '@/shared/types/api'

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

const extractDetails = (payload: ApiErrorPayload): ApiErrorMessageObject['details'] | null => {
  if (payload.details) {
    return payload.details
  }

  if (payload.message && typeof payload.message === 'object' && payload.message.details) {
    return payload.message.details
  }

  if (payload.error && typeof payload.error === 'object' && payload.error.details) {
    return payload.error.details
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

export const hasApiErrorDetail = (error: unknown, expectedDetail: string): boolean => {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return false
  }

  const payload = error.response?.data
  if (!payload) {
    return false
  }

  const details = extractDetails(payload)
  if (!details) {
    return false
  }

  if (typeof details === 'string') {
    return details === expectedDetail
  }

  if (Array.isArray(details)) {
    return details.includes(expectedDetail)
  }

  return Object.values(details).some((value) => value === expectedDetail)
}
