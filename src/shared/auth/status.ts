import { getAccessToken } from '@/shared/auth/token'

export const isAuthenticated = (): boolean => {
  return Boolean(getAccessToken())
}
