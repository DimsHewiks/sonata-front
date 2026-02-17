import type { Instrument } from '@/shared/types/profile'

export interface LoginFormValues {
  login: string
  password: string
}

export interface RegisterFormValues {
  name: string
  age: string
  login: string
  email: string
  password: string
  avatar: File | null
}

export interface AccessTokenResult {
  accessToken: string | null
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest' | 'error'

export interface RegistrationResponse {
  msg: string
}

export interface ProfileResponse {
  uuid: string
  name: string
  age: number
  login: string
  email: string | null
  avatarPath: string | null
  instruments: Instrument[]
  description: string | null
}
