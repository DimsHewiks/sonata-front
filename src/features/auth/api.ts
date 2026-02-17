import { apiClient } from '@/shared/api/client'
import { clearAccessToken, extractAccessToken, setAccessToken } from '@/shared/auth/token'
import type {
  AccessTokenResult,
  LoginFormValues,
  ProfileResponse,
  RegistrationResponse,
  RegisterFormValues,
} from './types'

export const authApi = {
  login: async (payload: LoginFormValues): Promise<AccessTokenResult> => {
    const response = await apiClient.post('/login', payload)
    const accessToken = extractAccessToken(response.headers['authorization'])
    if (accessToken) {
      setAccessToken(accessToken)
    }
    return { accessToken }
  },
  register: async (
    payload: RegisterFormValues,
  ): Promise<RegistrationResponse> => {
    const formData = new FormData()
    formData.append('name', payload.name)
    formData.append('age', payload.age)
    formData.append('login', payload.login)
    if (payload.email) {
      formData.append('email', payload.email)
    }
    formData.append('password', payload.password)
    if (payload.avatar) {
      formData.append('avatar', payload.avatar)
    }

    const response = await apiClient.post<RegistrationResponse>(
      '/registration',
      formData,
    )
    return response.data
  },
  refresh: async (): Promise<AccessTokenResult> => {
    const response = await apiClient.post('/refresh')
    const accessToken = extractAccessToken(response.headers['authorization'])
    if (accessToken) {
      setAccessToken(accessToken)
    }
    return { accessToken }
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/logout')
    clearAccessToken()
  },
  me: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>('/me')
    return response.data
  },
  updateDescription: async (description: string | null): Promise<void> => {
    await apiClient.put('/me/description', { description })
  },
  updateAvatar: async (file: File): Promise<{ relativePath: string; extension: string }> => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await apiClient.post<{ relativePath: string; extension: string }>(
      '/me/avatar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return response.data
  },
}
